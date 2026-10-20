import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type RecebedorPix,
  type NotificacaoPagamento,
} from '@/modules/pagamento/contracts/payment-provider.types';
import {
  PAYMENT_REPOSITORY,
  type CobrancaParaPagamento,
  type IniciarPagamentoInput,
  type PagamentoRepositoryPort,
} from '@/modules/pagamento/contracts/pagamento-repository.types';
import { RecebimentoPixService } from '@/modules/salao-configuracao/recebimento-pix.service';
import { emCentavos } from '@/modules/agendamento/agendamento-utils';
import {
  alocarPagamento,
  validarCotacao,
} from '@/modules/pagamento/pagamento-utils';

@Injectable()
export class PagamentoService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PagamentoRepositoryPort,
    private readonly recebimentoPix: RecebimentoPixService,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
  ) {}

  async consultar(
    input: Pick<
      IniciarPagamentoInput,
      'salaoId' | 'clienteId' | 'agendamentoId'
    >,
  ) {
    const pagamento = await this.repository.buscarPagamento({
      salaoId: input.salaoId,
      clienteId: input.clienteId,
      agendamentoId: input.agendamentoId,
    });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado.');
    return pagamento;
  }

  async processarNotificacao(input: {
    salaoId: string;
    notificacao: NotificacaoPagamento;
    agora?: Date;
  }) {
    const resultado = await this.repository.aplicarNotificacao({
      salaoId: input.salaoId,
      notificacao: input.notificacao,
      agora: input.agora ?? new Date(),
    });
    if (resultado === 'valor_divergente') {
      throw new ConflictException(
        'O valor confirmado não corresponde à cobrança.',
      );
    }
  }

  async iniciar(input: IniciarPagamentoInput & { agora?: Date }) {
    const agora = input.agora ?? new Date();
    const reserva = await this.repository.buscarReserva({
      salaoId: input.salaoId,
      clienteId: input.clienteId,
      id: input.agendamentoId,
    });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (
      reserva.estado !== 'reservado' ||
      !reserva.expira_em ||
      reserva.expira_em.getTime() <= agora.getTime()
    ) {
      throw new ConflictException('A reserva expirou ou foi encerrada.');
    }

    const existente = await this.repository.buscarTentativaAtiva({
      salaoId: input.salaoId,
      agendamentoId: input.agendamentoId,
    });

    if (existente) {
      return this.continuarTentativa({
        cobranca: existente,
        modalidade: input.modalidade,
        expiraEm: reserva.expira_em,
        salaoId: input.salaoId,
      });
    }

    const valorSinalCentavos = Number(
      emCentavos({ valor: reserva.valor_sinal }),
    );
    const valorSalaoCentavos = Number(
      emCentavos({
        valor:
          input.modalidade === 'sinal'
            ? reserva.valor_sinal
            : reserva.preco_total,
      }),
    );
    if (
      alocarPagamento({
        modalidade: input.modalidade,
        valorSalaoCentavos,
        valorSinalCentavos,
      }).length === 0
    ) {
      throw new BadRequestException('Não há sinal para cobrar.');
    }

    const configuracao = await this.recebimentoPix.buscar(input.salaoId);
    const recebedor: RecebedorPix = {
      tipoChave: configuracao.pix_tipo_chave as RecebedorPix['tipoChave'],
      chave: configuracao.pix_chave!,
      nomeRecebedor: configuracao.pix_nome_recebedor!,
    };
    const cotacao = await this.provider.quotePix({
      valorSalaoCentavos,
      recebedor,
    });
    if (!validarCotacao(cotacao)) {
      throw new BadRequestException('A cotação do pagamento é inconsistente.');
    }

    if (cotacao.valorSalaoCentavos !== valorSalaoCentavos) {
      throw new ConflictException('A cotação alterou o valor do salão.');
    }

    const cobranca = await this.repository.criarOuBuscarTentativa({
      ...input,
      idempotencyKey: randomUUID(),
      ...cotacao,
      recebedor,
      agora,
    });

    if (!cobranca) {
      throw new ConflictException('A reserva expirou ou foi encerrada.');
    }

    return this.continuarTentativa({
      cobranca,
      modalidade: input.modalidade,
      expiraEm: reserva.expira_em,
      salaoId: input.salaoId,
    });
  }

  private async continuarTentativa({
    cobranca,
    modalidade,
    expiraEm,
    salaoId,
  }: {
    cobranca: CobrancaParaPagamento;
    modalidade: IniciarPagamentoInput['modalidade'];
    expiraEm: Date;
    salaoId: string;
  }) {
    if (cobranca.modalidade !== modalidade) {
      throw new ConflictException(
        'Já há outro pagamento ativo para a reserva.',
      );
    }

    if (cobranca.status === 'pendente') {
      return cobranca;
    }

    const recebedor: RecebedorPix = {
      tipoChave: cobranca.pix_tipo_chave,
      chave: cobranca.pix_chave,
      nomeRecebedor: cobranca.pix_nome_recebedor,
    };
    const cotacao = {
      valorSalaoCentavos: Number(emCentavos({ valor: cobranca.valor })),
      taxaClienteCentavos: Number(emCentavos({ valor: cobranca.taxa_cliente })),
      totalClienteCentavos: Number(
        emCentavos({ valor: cobranca.total_cliente }),
      ),
    };
    if (!validarCotacao(cotacao)) {
      throw new BadRequestException('A cotação do pagamento é inconsistente.');
    }
    const criado = await this.provider.createPixPayment({
      idempotencyKey: cobranca.idempotency_key,
      cotacao,
      recebedor,
      expiraEm,
    });
    const pendente = await this.repository.marcarPendente({
      salaoId,
      cobrancaId: cobranca.id,
      externalId: criado.externalId,
      instrucaoCliente: criado.instrucaoCliente,
    });

    return pendente ?? cobranca;
  }
}
