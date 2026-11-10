import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { z } from 'zod';
import type {
  NotificacaoPagamento,
  WebhookPagamentoInput,
  PaymentProvider,
} from '@/modules/pagamento/contracts';
import { EfiClient } from '@/shared/providers/payment/efi/efi-client';
import { EfiWebhookAdapter } from '@/shared/providers/payment/efi/efi-webhook.adapter';
import {
  efiPaymentSchema,
  normalizarPagamentoEfi,
} from '@/shared/providers/payment/efi/efi-payment.mapper';

@Injectable()
export class EfiPaymentProvider implements PaymentProvider {
  readonly name = 'efi';
  readonly requiresPayer = true;
  private readonly logger = new Logger(EfiPaymentProvider.name);
  constructor(
    private readonly client: EfiClient,
    private readonly webhook: EfiWebhookAdapter,
    @Optional() private readonly config?: ConfigService<Env, true>,
  ) {}
  quotePix(input: Parameters<PaymentProvider['quotePix']>[0]) {
    return Promise.resolve({
      valorSalaoCentavos: input.valorSalaoCentavos,
      taxaClienteCentavos: 0,
      totalClienteCentavos: input.valorSalaoCentavos,
    });
  }
  async createPixPayment(
    input: Parameters<PaymentProvider['createPixPayment']>[0],
  ) {
    if (!input.pagador)
      throw new BadRequestException('Informe os dados do pagador.');
    if (input.expiraEm.getTime() <= Date.now())
      throw new BadRequestException('A reserva expirou.');

    const isHomologation =
      this.config?.get('EFI_ENVIRONMENT', { infer: true }) === 'homologation';
    const favorecido = isHomologation
      ? {
          contaBanco: {
            nome: input.recebedor.nomeRecebedor || 'Recebedor Fluy',
            documento: input.pagador.cpf || '17558266300',
            codigoBanco: '09089356',
            agencia: '0001',
            conta: '654984',
            tipoConta: 'TRAN',
          },
        }
      : { chave: input.recebedor.chave };

    const raw = await this.client.request({
      method: 'POST',
      path: '/v1/pagamentos/pix',
      headers: { 'x-idempotency-key': input.idempotencyKey },
      body: {
        pagador: {
          cpf: input.pagador.cpf,
          idParticipante: input.pagador.instituicao_id,
          ...(input.pagador.cnpj ? { cnpj: input.pagador.cnpj } : {}),
        },
        favorecido,
        pagamento: {
          valor: (input.cotacao.totalClienteCentavos / 100).toFixed(2),
          idProprio: input.idempotencyKey,
        },
      },
    });
    const result = z
      .object({
        identificadorPagamento: z.string().min(1).max(200),
        redirectURI: z.url().refine((v) => new URL(v).protocol === 'https:'),
      })
      .safeParse(raw);
    if (!result.success)
      throw new BadGatewayException('Resposta de pagamento inválida.');
    return {
      externalId: result.data.identificadorPagamento,
      status: 'pendente' as const,
      instrucaoCliente: {
        tipo: 'url' as const,
        valor: result.data.redirectURI,
      },
    };
  }
  async listPixParticipants() {
    const raw = await this.client.request({
      method: 'GET',
      path: '/v1/participantes?modalidade=pagamentos',
    });
    const result = z
      .object({
        participantes: z.array(
          z.object({ identificador: z.uuid(), nome: z.string().min(1) }),
        ),
      })
      .safeParse(raw);
    if (!result.success)
      throw new BadGatewayException('Resposta de instituições inválida.');
    return result.data.participantes.map((p) => ({
      id: p.identificador,
      nome: p.nome,
    }));
  }
  parseNotification(input: WebhookPagamentoInput): NotificacaoPagamento | null {
    return this.webhook.parseNotification(input);
  }
  async getPixPayment(input: {
    externalId: string;
    createdAt: Date;
  }): Promise<NotificacaoPagamento | null> {
    const dInicio = input.createdAt.toISOString().slice(0, 10);
    const dFim = new Date().toISOString().slice(0, 10);
    const inicio = dInicio <= dFim ? dInicio : dFim;
    const fim = dInicio <= dFim ? dFim : dInicio;
    let path = `/v1/pagamentos/pix?inicio=${inicio}&fim=${fim}`;
    const visited = new Set<string>();
    for (let page = 0; page < 100; page++) {
      if (visited.has(path))
        throw new BadGatewayException('Paginação do provedor inválida.');
      visited.add(path);
      let raw: unknown;
      try {
        raw = await this.client.request({ method: 'GET', path });
      } catch (error) {
        if (error instanceof NotFoundException) return null;
        throw error;
      }
      if (!raw || typeof raw !== 'object') {
        throw new BadGatewayException('Resposta de consulta inválida.');
      }
      const rawObj = raw as { pagamentos?: unknown; proximo?: unknown };
      if (!Array.isArray(rawObj.pagamentos)) {
        throw new BadGatewayException('Resposta de consulta inválida.');
      }
      const foundRaw = rawObj.pagamentos.find(
        (p: any) =>
          p &&
          typeof p === 'object' &&
          (p.identificadorPagamento === input.externalId ||
            (p.idProprio && p.idProprio === input.externalId)),
      );
      if (foundRaw) {
        const parsed = efiPaymentSchema.safeParse(foundRaw);
        if (parsed.success) {
          return normalizarPagamentoEfi(parsed.data);
        }
        this.logger.warn({
          evento: 'efi_payment_parse_falha',
          externalId: input.externalId,
          error: parsed.error.issues,
        });
        throw new BadGatewayException('Resposta de consulta inválida.');
      }
      if (!rawObj.proximo) return null;
      if (
        typeof rawObj.proximo !== 'string' ||
        !/^\/(v1\/)?pagamentos\/pix\?/.test(rawObj.proximo)
      )
        throw new BadGatewayException('Paginação do provedor inválida.');
      path = rawObj.proximo.startsWith('/v1/')
        ? rawObj.proximo
        : `/v1${rawObj.proximo}`;
    }
    throw new BadGatewayException(
      'Consulta do provedor excedeu o limite de páginas.',
    );
  }
}
