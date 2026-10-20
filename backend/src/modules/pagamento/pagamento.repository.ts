import { and, desc, eq, inArray, lte } from 'drizzle-orm';
import {
  agendamento,
  cobrancaGateway,
  eventoAgendamento,
  pagamentoAgendamento,
  salao,
  webhookGatewayEvento,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { PagamentoRepositoryPort } from '@/modules/pagamento/contracts/pagamento-repository.types';
import {
  emCentavos,
  formatarCentavos,
} from '@/modules/agendamento/agendamento-utils';
import {
  decidirNotificacao,
  normalizarTipoEvento,
} from '@/modules/pagamento/pagamento-estado';
import { chaveIdempotenciaEvento } from '@/modules/pagamento/pagamento-utils';

const STATUS_ATIVOS = ['iniciando', 'pendente'] as const;

@Injectable()
export class PagamentoRepository implements PagamentoRepositoryPort {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarReserva(input: {
    salaoId: string;
    clienteId: string;
    id: string;
  }) {
    const linhas = await this.database
      .select()
      .from(agendamento)
      .where(
        and(
          eq(agendamento.id, input.id),
          eq(agendamento.salao_id, input.salaoId),
          eq(agendamento.cliente_id, input.clienteId),
        ),
      )
      .limit(1);
    return linhas[0];
  }

  async buscarTentativaAtiva(input: {
    salaoId: string;
    agendamentoId: string;
  }) {
    const linhas = await this.database
      .select()
      .from(cobrancaGateway)
      .where(
        and(
          eq(cobrancaGateway.salao_id, input.salaoId),
          eq(cobrancaGateway.agendamento_id, input.agendamentoId),
          inArray(cobrancaGateway.status, [...STATUS_ATIVOS]),
        ),
      )
      .orderBy(desc(cobrancaGateway.criada_em))
      .limit(1);
    return linhas[0] as Awaited<
      ReturnType<PagamentoRepositoryPort['buscarTentativaAtiva']>
    >;
  }

  async buscarPagamento(input: {
    salaoId: string;
    clienteId: string;
    agendamentoId: string;
  }) {
    const linhas = await this.database
      .select({
        cobranca: cobrancaGateway,
        expira_em: agendamento.expira_em,
        estado_reserva: agendamento.estado,
      })
      .from(cobrancaGateway)
      .innerJoin(
        agendamento,
        eq(agendamento.id, cobrancaGateway.agendamento_id),
      )
      .where(
        and(
          eq(agendamento.id, input.agendamentoId),
          eq(agendamento.salao_id, input.salaoId),
          eq(agendamento.cliente_id, input.clienteId),
          eq(cobrancaGateway.salao_id, input.salaoId),
        ),
      )
      .orderBy(desc(cobrancaGateway.criada_em))
      .limit(1);
    const linha = linhas[0];
    return linha
      ? ({
          ...linha.cobranca,
          expira_em: linha.expira_em,
          estado_reserva: linha.estado_reserva,
        } as Awaited<ReturnType<PagamentoRepositoryPort['buscarPagamento']>>)
      : undefined;
  }

  async buscarCobrancaPorId(input: { salaoId: string; cobrancaId: string }) {
    const linhas = await this.database
      .select()
      .from(cobrancaGateway)
      .where(
        and(
          eq(cobrancaGateway.id, input.cobrancaId),
          eq(cobrancaGateway.salao_id, input.salaoId),
        ),
      )
      .limit(1);
    return linhas[0] as Awaited<
      ReturnType<PagamentoRepositoryPort['buscarCobrancaPorId']>
    >;
  }

  async criarOuBuscarTentativa(input: {
    salaoId: string;
    clienteId: string;
    agendamentoId: string;
    modalidade: 'sinal' | 'total';
    idempotencyKey: string;
    valorSalaoCentavos: number;
    taxaClienteCentavos: number;
    totalClienteCentavos: number;
    recebedor: {
      tipoChave: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
      chave: string;
      nomeRecebedor: string;
    };
    agora: Date;
  }) {
    return this.database.transaction(async (tx) => {
      const reservas = await tx
        .select()
        .from(agendamento)
        .where(
          and(
            eq(agendamento.id, input.agendamentoId),
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.cliente_id, input.clienteId),
          ),
        )
        .for('update')
        .limit(1);
      const reserva = reservas[0];

      if (
        !reserva ||
        reserva.estado !== 'reservado' ||
        !reserva.expira_em ||
        reserva.expira_em.getTime() <= input.agora.getTime()
      ) {
        return undefined;
      }

      const ativas = await tx
        .select()
        .from(cobrancaGateway)
        .where(
          and(
            eq(cobrancaGateway.salao_id, input.salaoId),
            eq(cobrancaGateway.agendamento_id, input.agendamentoId),
            inArray(cobrancaGateway.status, [...STATUS_ATIVOS]),
          ),
        )
        .limit(1);
      if (ativas[0]) {
        return ativas[0] as Awaited<
          ReturnType<PagamentoRepositoryPort['criarOuBuscarTentativa']>
        >;
      }

      const criadas = await tx
        .insert(cobrancaGateway)
        .values({
          salao_id: input.salaoId,
          agendamento_id: input.agendamentoId,
          modalidade: input.modalidade,
          idempotency_key: input.idempotencyKey,
          valor: formatarCentavos({ valor: BigInt(input.valorSalaoCentavos) }),
          taxa_cliente: formatarCentavos({
            valor: BigInt(input.taxaClienteCentavos),
          }),
          total_cliente: formatarCentavos({
            valor: BigInt(input.totalClienteCentavos),
          }),
          pix_tipo_chave: input.recebedor.tipoChave,
          pix_chave: input.recebedor.chave,
          pix_nome_recebedor: input.recebedor.nomeRecebedor,
          metodo: 'pix',
          status: 'iniciando',
        })
        .returning();
      return criadas[0] as Awaited<
        ReturnType<PagamentoRepositoryPort['criarOuBuscarTentativa']>
      >;
    });
  }

  async marcarPendente(input: {
    salaoId: string;
    cobrancaId: string;
    externalId: string;
    instrucaoCliente: { tipo: 'url'; valor: string } | null;
  }) {
    const linhas = await this.database
      .update(cobrancaGateway)
      .set({
        id_externo: input.externalId,
        instrucao_cliente: input.instrucaoCliente,
        status: 'pendente',
      })
      .where(
        and(
          eq(cobrancaGateway.id, input.cobrancaId),
          eq(cobrancaGateway.salao_id, input.salaoId),
          eq(cobrancaGateway.status, 'iniciando'),
        ),
      )
      .returning();
    return linhas[0] as Awaited<
      ReturnType<PagamentoRepositoryPort['marcarPendente']>
    >;
  }

  async aplicarNotificacao(input: {
    salaoId: string;
    notificacao: {
      eventId: string;
      externalPaymentId: string;
      tipo: 'confirmado' | 'falhou' | 'expirado';
      ocorridoEm: Date;
      valorPagoCentavos?: number;
    };
    agora: Date;
  }): Promise<'valor_divergente' | undefined> {
    return this.database.transaction(async (tx) => {
      const cobrancas = await tx
        .select()
        .from(cobrancaGateway)
        .where(
          and(
            eq(cobrancaGateway.salao_id, input.salaoId),
            eq(cobrancaGateway.id_externo, input.notificacao.externalPaymentId),
          ),
        )
        .limit(1);
      const encontrada = cobrancas[0];
      if (
        !encontrada?.agendamento_id ||
        !encontrada.modalidade ||
        !encontrada.total_cliente
      ) {
        return;
      }

      const reservas = await tx
        .select()
        .from(agendamento)
        .where(
          and(
            eq(agendamento.id, encontrada.agendamento_id),
            eq(agendamento.salao_id, input.salaoId),
          ),
        )
        .for('update')
        .limit(1);
      const reserva = reservas[0];
      if (!reserva) {
        return;
      }

      // Serializa eventos da mesma reserva antes de decidir; uma leitura anterior
      // ao lock poderia promover duas vezes ou marcar divergência indevida.
      const atuais = await tx
        .select()
        .from(cobrancaGateway)
        .where(
          and(
            eq(cobrancaGateway.id, encontrada.id),
            eq(cobrancaGateway.salao_id, input.salaoId),
          ),
        )
        .for('update')
        .limit(1);
      const cobranca = atuais[0];
      if (!cobranca?.modalidade || !cobranca.total_cliente) return;

      const decisao = decidirNotificacao({
        tipo: input.notificacao.tipo,
        valorPagoCentavos: input.notificacao.valorPagoCentavos,
        statusCobranca: cobranca.status,
        estadoReserva: reserva.estado,
        expiraEm: reserva.expira_em,
        agora: input.agora,
        modalidade: cobranca.modalidade,
        valorSalaoCentavos: Number(emCentavos({ valor: cobranca.valor })),
        valorSinalCentavos: Number(emCentavos({ valor: reserva.valor_sinal })),
        totalClienteCentavos: Number(
          emCentavos({ valor: cobranca.total_cliente }),
        ),
      });
      if ('erro' in decisao) return decisao.erro;

      const eventos = await tx
        .insert(webhookGatewayEvento)
        .values({
          id_externo: chaveIdempotenciaEvento({
            salaoId: input.salaoId,
            eventoId: input.notificacao.eventId,
          }),
          salao_id: input.salaoId,
          cobranca_gateway_id: cobranca.id,
          tipo_bruto: input.notificacao.tipo,
          tipo_normalizado: normalizarTipoEvento(input.notificacao.tipo),
          payload: {
            eventId: input.notificacao.eventId,
            externalPaymentId: input.notificacao.externalPaymentId,
            valorPagoCentavos: input.notificacao.valorPagoCentavos,
          },
          status: 'processado',
          processado_em: input.agora,
        })
        .onConflictDoNothing()
        .returning({ id: webhookGatewayEvento.id });
      if (eventos.length === 0) {
        return;
      }

      await tx
        .update(cobrancaGateway)
        .set({
          status: decisao.novoStatus,
          divergencia: decisao.divergencia || cobranca.divergencia,
          ...(decisao.novoStatus === 'confirmada'
            ? { confirmada_em: input.notificacao.ocorridoEm }
            : {}),
        })
        .where(
          and(
            eq(cobrancaGateway.id, cobranca.id),
            eq(cobrancaGateway.salao_id, input.salaoId),
          ),
        );

      if (!decisao.promoverReserva) {
        return;
      }

      await tx
        .update(agendamento)
        .set({ estado: 'agendado' })
        .where(
          and(
            eq(agendamento.id, reserva.id),
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.estado, 'reservado'),
          ),
        );
      await tx.insert(pagamentoAgendamento).values(
        decisao.alocacoes.map((alocacao) => ({
          agendamento_id: reserva.id,
          cobranca_gateway_id: cobranca.id,
          tipo: alocacao.tipo,
          valor: formatarCentavos({ valor: BigInt(alocacao.valorCentavos) }),
        })),
      );
    });
  }

  async expirarReservasDoSalao(input: { salaoId: string; agora: Date }) {
    return this.database.transaction(async (tx) => {
      const expiradas = await tx
        .update(agendamento)
        .set({ estado: 'cancelado' })
        .where(
          and(
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.estado, 'reservado'),
            lte(agendamento.expira_em, input.agora),
          ),
        )
        .returning({ id: agendamento.id });
      if (expiradas.length === 0) {
        return 0;
      }

      await tx.insert(eventoAgendamento).values(
        expiradas.map((reserva) => ({
          agendamento_id: reserva.id,
          tipo: 'cancelado' as const,
          motivo: 'Reserva expirada.',
          ocorreu_em: input.agora,
        })),
      );
      await tx
        .update(cobrancaGateway)
        .set({ status: 'expirada' })
        .where(
          and(
            eq(cobrancaGateway.salao_id, input.salaoId),
            inArray(
              cobrancaGateway.agendamento_id,
              expiradas.map((reserva) => reserva.id),
            ),
            inArray(cobrancaGateway.status, [...STATUS_ATIVOS]),
          ),
        );
      return expiradas.length;
    });
  }

  listarSalaos() {
    return this.database.select({ id: salao.id }).from(salao);
  }
}
