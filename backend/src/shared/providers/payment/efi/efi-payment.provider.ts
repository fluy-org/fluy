import {
  BadGatewayException,
  BadRequestException,
  Injectable,
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
    let path = `/v1/pagamentos/pix?inicio=${input.createdAt.toISOString().slice(0, 10)}&fim=${new Date().toISOString().slice(0, 10)}`;
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
      const result = z
        .object({
          pagamentos: z.array(efiPaymentSchema),
          proximo: z.string().nullable().optional(),
        })
        .safeParse(raw);
      if (!result.success)
        throw new BadGatewayException('Resposta de consulta inválida.');
      const found = result.data.pagamentos.find(
        (p) => p.identificadorPagamento === input.externalId,
      );
      if (found) return normalizarPagamentoEfi(found);
      if (!result.data.proximo) return null;
      if (!/^\/(v1\/)?pagamentos\/pix\?/.test(result.data.proximo))
        throw new BadGatewayException('Paginação do provedor inválida.');
      path = result.data.proximo.startsWith('/v1/')
        ? result.data.proximo
        : `/v1${result.data.proximo}`;
    }
    throw new BadGatewayException(
      'Consulta do provedor excedeu o limite de páginas.',
    );
  }
}
