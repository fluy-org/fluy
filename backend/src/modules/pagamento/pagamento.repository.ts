import { and, asc, desc, eq, inArray, lte, or, sql, isNull } from 'drizzle-orm';
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

import type { NotificacaoPagamento } from './contracts/payment-provider.types';

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
    provedor: string;
    valorSalaoCentavos: number;
    taxaClienteCentavos: number;
    totalClienteCentavos: number;
    recebedor: {
      tipoChave: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
      chave: string;
      nomeRecebedor: string;
    };
    pagador?: { cpf: string; instituicao_id: string; cnpj?: string };
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
          pagador: input.pagador ?? null,
          provedor: input.provedor,
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
        status: sql`case when ${cobrancaGateway.status} = 'iniciando' then 'pendente' else ${cobrancaGateway.status} end`,
      })
      .where(
        and(
          eq(cobrancaGateway.id, input.cobrancaId),
          eq(cobrancaGateway.salao_id, input.salaoId),
          or(
            isNull(cobrancaGateway.id_externo),
            eq(cobrancaGateway.id_externo, input.externalId),
          ),
        ),
      )
      .returning();
    return linhas[0] as Awaited<
      ReturnType<PagamentoRepositoryPort['marcarPendente']>
    >;
  }

  async aplicarNotificacao(input: {
    salaoId: string;
    notificacao: NotificacaoPagamento;
    agora: Date;
  }): Promise<'valor_divergente' | undefined> {
    return this.database.transaction(async (tx) => {
      const cobrancas = await tx
        .select()
        .from(cobrancaGateway)
        .where(
          and(
            eq(cobrancaGateway.salao_id, input.salaoId),
            eq(cobrancaGateway.provedor, input.notificacao.provider),
            or(
              eq(
                cobrancaGateway.id_externo,
                input.notificacao.externalPaymentId,
              ),
              input.notificacao.reference
                ? and(
                    eq(
                      cobrancaGateway.idempotency_key,
                      input.notificacao.reference,
                    ),
                    eq(cobrancaGateway.provedor, input.notificacao.provider),
                  )
                : undefined,
            ),
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
      if (
        cobranca.id_externo &&
        cobranca.id_externo !== input.notificacao.externalPaymentId
      )
        return;

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

      const eventoExternoId = chaveIdempotenciaEvento({
        salaoId: input.notificacao.provider,
        eventoId: input.notificacao.eventId,
      });
      let registroId = input.notificacao.registroId;
      if (!registroId) {
        const eventos = await tx
          .insert(webhookGatewayEvento)
          .values({
            id_externo: eventoExternoId,
            salao_id: input.salaoId,
            cobranca_gateway_id: cobranca.id,
            tipo_bruto: input.notificacao.tipoBruto ?? input.notificacao.tipo,
            tipo_normalizado: normalizarTipoEvento(input.notificacao.tipo),
            payload: {
              ...input.notificacao,
              ocorridoEm: input.notificacao.ocorridoEm.toISOString(),
            },
            status: 'recebido',
          })
          .onConflictDoNothing()
          .returning({ id: webhookGatewayEvento.id });
        registroId = eventos[0]?.id;
      }
      const registros = await tx
        .select()
        .from(webhookGatewayEvento)
        .where(
          registroId
            ? eq(webhookGatewayEvento.id, registroId)
            : eq(webhookGatewayEvento.id_externo, eventoExternoId),
        )
        .for('update')
        .limit(1);
      const registro = registros[0];
      if (!registro || registro.status === 'processado') return;
      await tx
        .update(webhookGatewayEvento)
        .set({
          status: 'processado',
          salao_id: input.salaoId,
          cobranca_gateway_id: cobranca.id,
          processado_em: input.agora,
          erro_mensagem: null,
        })
        .where(eq(webhookGatewayEvento.id, registro.id));
      await tx
        .update(cobrancaGateway)
        .set({
          status: decisao.novoStatus,
          id_externo: input.notificacao.externalPaymentId,
          divergencia: decisao.divergencia || cobranca.divergencia,
          ...(decisao.novoStatus === 'confirmada' &&
          cobranca.status !== 'confirmada'
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

  async registrarNotificacao(notificacao: NotificacaoPagamento) {
    const idExterno = chaveIdempotenciaEvento({
      salaoId: notificacao.provider,
      eventoId: notificacao.eventId,
    });
    await this.database
      .insert(webhookGatewayEvento)
      .values({
        id_externo: idExterno,
        tipo_bruto: notificacao.tipoBruto ?? notificacao.tipo,
        tipo_normalizado: normalizarTipoEvento(notificacao.tipo),
        payload: {
          ...notificacao,
          ocorridoEm: notificacao.ocorridoEm.toISOString(),
        },
        status: 'recebido',
      })
      .onConflictDoNothing();
    const registros = await this.database
      .select()
      .from(webhookGatewayEvento)
      .where(eq(webhookGatewayEvento.id_externo, idExterno))
      .limit(1);
    return registros[0];
  }

  // A notificação autenticada não possui tenant; apenas esta correlação global
  // resolve o salão antes das operações financeiras filtradas pelo tenant.
  async buscarCobrancaDoEvento(notificacao: NotificacaoPagamento) {
    const registros = await this.database
      .select()
      .from(cobrancaGateway)
      .where(
        and(
          eq(cobrancaGateway.provedor, notificacao.provider),
          or(
            eq(cobrancaGateway.id_externo, notificacao.externalPaymentId),
            notificacao.reference
              ? eq(cobrancaGateway.idempotency_key, notificacao.reference)
              : undefined,
          ),
        ),
      )
      .limit(1);
    return registros[0];
  }

  listarNotificacoesPendentes() {
    return this.database
      .select()
      .from(webhookGatewayEvento)
      .where(and(inArray(webhookGatewayEvento.status, ['recebido', 'falhou'])))
      .orderBy(asc(webhookGatewayEvento.atualizado_em))
      .limit(20);
  }

  async reagendarNotificacao(input: { id: string; falhou?: boolean }) {
    await this.database
      .update(webhookGatewayEvento)
      .set({
        atualizado_em: new Date(),
        ...(input.falhou
          ? {
              status: 'falhou' as const,
              erro_mensagem:
                'Falha no processamento. Reprocessamento pendente.',
            }
          : {}),
      })
      .where(
        and(
          eq(webhookGatewayEvento.id, input.id),
          inArray(webhookGatewayEvento.status, ['recebido', 'falhou']),
        ),
      );
  }

  listarSalaos() {
    return this.database.select({ id: salao.id }).from(salao);
  }
}
