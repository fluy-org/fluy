import { decidirNotificacao } from '@/modules/pagamento/pagamento-estado-utils';
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type RecebedorPix,
  type NotificacaoPagamento,
  AGENDAMENTO_DETALHE_PORT,
  AGENDAMENTO_AVISO_PORT,
  type AgendamentoDetalhePort,
  type AgendamentoAvisoPort,
} from '@/modules/pagamento/contracts';
import {
  PAYMENT_REPOSITORY,
  type CobrancaParaPagamento,
  type IniciarPagamentoInput,
  type PagamentoRepositoryPort,
} from '@/modules/pagamento/contracts';
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
    @Optional()
    @Inject(AGENDAMENTO_DETALHE_PORT)
    private readonly agendamentoService?: AgendamentoDetalhePort,
    @Optional()
    @Inject(AGENDAMENTO_AVISO_PORT)
    private readonly agendamentoAvisoService?: AgendamentoAvisoPort,
  ) {}

  private readonly logger = new Logger(PagamentoService.name);

  async listarInstituicoes() {
    if (!this.provider.listPixParticipants) return [];
    return this.provider.listPixParticipants();
  }

  async consultar(
    input: Pick<
      IniciarPagamentoInput,
      'salaoId' | 'clienteId' | 'agendamentoId'
    > & { sincronizar?: boolean },
  ) {
    const pagamento = await this.repository.buscarPagamento({
      salaoId: input.salaoId,
      clienteId: input.clienteId,
      agendamentoId: input.agendamentoId,
    });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado.');
    if (pagamento.provedor !== this.provider.name)
      throw new ConflictException('O pagamento pertence a outro provedor.');
    if (
      input.sincronizar !== false &&
      this.provider.getPixPayment &&
      pagamento.id_externo &&
      pagamento.criada_em &&
      pagamento.status !== 'confirmada'
    ) {
      const notificacao = await this.provider.getPixPayment({
        externalId: pagamento.id_externo,
        createdAt: pagamento.criada_em,
      });
      if (notificacao) {
        await this.processarNotificacao({
          salaoId: input.salaoId,
          notificacao,
        });
        return (await this.repository.buscarPagamento(input)) ?? pagamento;
      }
    }
    return pagamento;
  }

  async processarNotificacao(input: {
    salaoId: string;
    notificacao: NotificacaoPagamento;
    agora?: Date;
  }) {
    if (!input.notificacao.provider?.trim())
      throw new BadRequestException('Informe a origem da notificação.');
    const resultado = await this.repository.aplicarNotificacao({
      salaoId: input.salaoId,
      notificacao: input.notificacao,
      agora: input.agora ?? new Date(),
      decidir: decidirNotificacao,
    });
    if (resultado === 'valor_divergente') {
      throw new ConflictException(
        'O valor confirmado não corresponde à cobrança.',
      );
    }
    if (typeof resultado === 'object' && resultado !== null) {
      if (resultado.resultado === 'promovido' && resultado.agendamentoId) {
        await this.dispararAvisoAgendamentoPago({
          salaoId: input.salaoId,
          agendamentoId: resultado.agendamentoId,
        });
      } else if (
        resultado.resultado === 'confirmado_apos_expiracao' &&
        resultado.agendamentoId
      ) {
        await this.dispararAvisoPagamentoAposPrazo({
          salaoId: input.salaoId,
          agendamentoId: resultado.agendamentoId,
        });
      }
    }
  }

  async reconciliarCobrancasPendentes(input: { salaoId: string; agora: Date }) {
    if (
      !this.repository.listarCobrancasPendentesParaReconciliacao ||
      !this.provider.getPixPayment
    ) {
      return 0;
    }
    const pendentes =
      await this.repository.listarCobrancasPendentesParaReconciliacao(input);
    let confirmadas = 0;
    for (const cobranca of pendentes) {
      if (!cobranca.id_externo || cobranca.provedor !== this.provider.name)
        continue;
      try {
        const notificacao = await this.provider.getPixPayment({
          externalId: cobranca.id_externo,
          createdAt: cobranca.criada_em ?? input.agora,
        });
        if (notificacao && notificacao.tipo === 'confirmado') {
          await this.processarNotificacao({
            salaoId: input.salaoId,
            notificacao,
            agora: input.agora,
          });
          confirmadas++;
        }
      } catch {
        // Falha pontual na consulta de uma cobrança não aborta a reconciliação das demais
      }
    }
    return confirmadas;
  }

  async buscarRetornoPorIdentificador(identificadorPagamento: string) {
    if (!this.repository.buscarRetornoPorIdentificador) {
      return { encontrado: false };
    }
    return this.repository.buscarRetornoPorIdentificador({
      identificadorPagamento,
      provedor: this.provider.name,
    });
  }

  private async dispararAvisoAgendamentoPago(input: {
    salaoId: string;
    agendamentoId: string;
  }) {
    if (!this.agendamentoService || !this.agendamentoAvisoService) return;
    try {
      const detalhe = await this.agendamentoService.buscarDetalhe({
        id: input.agendamentoId,
        salaoId: input.salaoId,
      });
      if (detalhe) {
        await this.agendamentoAvisoService.notificarAgendamentoPagoConfirmado(
          detalhe,
        );
      }
    } catch (error) {
      this.logger.warn({
        evento: 'aviso_pagamento_pago_falha',
        erro: error instanceof Error ? error.message : String(error),
        agendamentoId: input.agendamentoId,
        salaoId: input.salaoId,
      });
    }
  }

  private async dispararAvisoPagamentoAposPrazo(input: {
    salaoId: string;
    agendamentoId: string;
  }) {
    if (!this.agendamentoService || !this.agendamentoAvisoService) return;
    try {
      const detalhe = await this.agendamentoService.buscarDetalhe({
        id: input.agendamentoId,
        salaoId: input.salaoId,
      });
      if (detalhe) {
        await this.agendamentoAvisoService.notificarPagamentoAposPrazo(detalhe);
      }
    } catch (error) {
      this.logger.warn({
        evento: 'aviso_pagamento_apos_prazo_falha',
        erro: error instanceof Error ? error.message : String(error),
        agendamentoId: input.agendamentoId,
        salaoId: input.salaoId,
      });
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

    if (this.provider.requiresPayer && !input.pagador)
      throw new BadRequestException('Informe os dados do pagador.');
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
      provedor: this.provider.name,
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
    if (cobranca.provedor !== this.provider.name)
      throw new ConflictException('O pagamento pertence a outro provedor.');
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
      ...(cobranca.pagador ? { pagador: cobranca.pagador } : {}),
    });
    const pendente = await this.repository.marcarPendente({
      salaoId,
      cobrancaId: cobranca.id,
      externalId: criado.externalId,
      instrucaoCliente: criado.instrucaoCliente,
    });

    return (
      pendente ??
      (await this.repository.buscarCobrancaPorId({
        salaoId,
        cobrancaId: cobranca.id,
      })) ??
      cobranca
    );
  }
}
