import {
  agruparAgendamentos,
  condicaoDeSobreposicao,
} from '@/modules/agendamento/agendamento-utils';
import { and, asc, desc, eq, gt, gte, inArray, lt, ne, or, sql } from 'drizzle-orm';
import {
  agendamento,
  anexoAgendamento,
  cliente,
  cobrancaGateway,
  cobrancaManual,
  eventoAgendamento,
  lembrete,
  nota,
  pagamentoAgendamento,
  procedimento,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import {
  adicionarDiasNaData,
  dataHoraCivilParaUtc,
} from '@/shared/horario-salao/horario-salao.utils';
import type {
  AgendamentoDaAgendaPersistido,
  AgendamentoDetalhePersistido,
  AgendamentoPersistido,
  BuscarAgendamentoInput,
  CancelarAgendamentoPersistenciaInput,
  ConcluirAgendamentoPersistenciaInput,
  CriarAgendamentoComValidacaoInput,
  InstanteDeAgendamentoPersistido,
  ListarAgendamentosDoDiaInput,
  ListarInstantesDoPeriodoInput,
  ListarOcupacoesDoDiaInput,
  MarcarFaltaAgendamentoPersistenciaInput,
  OcupacaoProfissional,
  PossuiAgendamentoDoProcedimentoNoDiaInput,
  RemarcarAgendamentoPersistenciaInput,
} from '@/modules/agendamento/contracts';

@Injectable()
export class AgendamentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  listarOcupacoesDoDia({
    salaoId,
    data,
    fusoHorario,
    ignorarAgendamentoId,
  }: ListarOcupacoesDoDiaInput): Promise<OcupacaoProfissional[]> {
    const inicioDia = dataHoraCivilParaUtc({
      data,
      hora: '00:00',
      fusoHorario,
    });
    const fimDia = dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    });

    return this.database
      .select({
        profissional_id: agendamento.profissional_id,
        inicio_em: agendamento.inicio_em,
        duracao_min: agendamento.duracao_min,
      })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.salao_id, salaoId),
          or(
            eq(agendamento.estado, 'agendado'),
            and(
              eq(agendamento.estado, 'reservado'),
              gt(agendamento.expira_em, sql`now()`),
            ),
          ),
          gte(agendamento.inicio_em, inicioDia),
          lt(agendamento.inicio_em, fimDia),
          ignorarAgendamentoId
            ? ne(agendamento.id, ignorarAgendamentoId)
            : undefined,
        ),
      );
  }

  async buscarAgendamentoDoProcedimentoNoDia(
    input: PossuiAgendamentoDoProcedimentoNoDiaInput,
  ): Promise<{ id: string; estado: 'reservado' | 'agendado' } | undefined> {
    const resultados = await this.database
      .select({
        id: agendamento.id,
        estado: agendamento.estado,
      })
      .from(agendamento)
      .where(this.condicaoAgendamentoDoProcedimentoNoDia(input))
      .limit(1);

    return resultados[0] as
      | { id: string; estado: 'reservado' | 'agendado' }
      | undefined;
  }

  async possuiAgendamentoDoProcedimentoNoDia(
    input: PossuiAgendamentoDoProcedimentoNoDiaInput,
  ): Promise<boolean> {
    const encontrado = await this.buscarAgendamentoDoProcedimentoNoDia(input);
    return Boolean(encontrado);
  }

  async listarDoDia({
    salaoId,
    data,
    fusoHorario,
  }: ListarAgendamentosDoDiaInput): Promise<AgendamentoDaAgendaPersistido[]> {
    const inicioDia = dataHoraCivilParaUtc({
      data,
      hora: '00:00',
      fusoHorario,
    });
    const fimDia = dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    });
    const linhas = await this.selecionarAgenda()
      .where(
        and(
          eq(agendamento.salao_id, salaoId),
          gte(agendamento.inicio_em, inicioDia),
          lt(agendamento.inicio_em, fimDia),
        ),
      )
      .orderBy(asc(agendamento.inicio_em));

    return agruparAgendamentos(linhas);
  }

  listarInstantesDoPeriodo({
    salaoId,
    dataInicio,
    dataFim,
    fusoHorario,
  }: ListarInstantesDoPeriodoInput): Promise<
    InstanteDeAgendamentoPersistido[]
  > {
    const inicioPeriodo = dataHoraCivilParaUtc({
      data: dataInicio,
      hora: '00:00',
      fusoHorario,
    });
    const fimPeriodo = dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data: dataFim, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    });

    return this.database
      .select({ inicio_em: agendamento.inicio_em })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.salao_id, salaoId),
          gte(agendamento.inicio_em, inicioPeriodo),
          lt(agendamento.inicio_em, fimPeriodo),
        ),
      );
  }

  async buscarDetalhe({
    id,
    salaoId,
  }: BuscarAgendamentoInput): Promise<
    AgendamentoDetalhePersistido | undefined
  > {
    const linhas = await this.selecionarAgenda().where(
      and(eq(agendamento.id, id), eq(agendamento.salao_id, salaoId)),
    );
    const agendamentoDaAgenda = agruparAgendamentos(linhas)[0];

    if (!agendamentoDaAgenda) {
      return undefined;
    }

    const [remarcacoes, cancelamentos, cobrancas] = await Promise.all([
      this.database
        .select({ id: eventoAgendamento.id })
        .from(eventoAgendamento)
        .where(
          and(
            eq(eventoAgendamento.agendamento_id, id),
            eq(eventoAgendamento.tipo, 'remarcado'),
          ),
        ),
      this.database
        .select({ motivo: eventoAgendamento.motivo })
        .from(eventoAgendamento)
        .where(
          and(
            eq(eventoAgendamento.agendamento_id, id),
            eq(eventoAgendamento.tipo, 'cancelado'),
          ),
        )
        .orderBy(desc(eventoAgendamento.ocorreu_em))
        .limit(1),
      this.database
        .select({
          status: cobrancaGateway.status,
          divergencia: cobrancaGateway.divergencia,
        })
        .from(cobrancaGateway)
        .where(
          and(
            eq(cobrancaGateway.agendamento_id, id),
            eq(cobrancaGateway.salao_id, salaoId),
          ),
        )
        .orderBy(desc(cobrancaGateway.criada_em))
        .limit(1),
    ]);

    return {
      ...agendamentoDaAgenda,
      remarcado_vezes: remarcacoes.length,
      motivo_cancelamento: cancelamentos[0]?.motivo === 'Reserva expirada.'
        ? 'Reserva expirada.'
        : (cancelamentos[0]?.motivo?.includes('pela cliente')
          ? cancelamentos[0].motivo
          : null),
      status_pagamento: cobrancas[0]?.status ?? null,
      situacao_pagamento: cobrancas[0]?.divergencia
        ? 'confirmado_apos_expiracao'
        : (cobrancas[0] ? 'normal' : null),
    };
  }

  async criar(
    input: CriarAgendamentoComValidacaoInput,
  ): Promise<AgendamentoPersistido | undefined> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${input.salaoId}:${input.dataAgendamento}`}))`,
      );

      if (input.bloquearProcedimentoDuplicadoNoDia) {
        const duplicados = await tx
          .select({ id: agendamento.id })
          .from(agendamento)
          .where(
            this.condicaoAgendamentoDoProcedimentoNoDia({
              salaoId: input.salaoId,
              clienteId: input.clienteId,
              procedimentoId: input.procedimentoId,
              data: input.dataAgendamento,
              fusoHorario: input.fusoHorario,
            }),
          )
          .limit(1);

        if (duplicados.length > 0) {
          return undefined;
        }
      }

      const conflitos = await tx
        .select({ id: agendamento.id })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.profissional_id, input.profissionalId),
            condicaoDeSobreposicao({
              inicioEm: input.inicioEm,
              duracaoMin: input.duracaoMin,
            }),
          ),
        )
        .limit(1);

      if (conflitos.length > 0) {
        return undefined;
      }

      const agendamentosCriados = await tx
        .insert(agendamento)
        .values({
          salao_id: input.salaoId,
          cliente_id: input.clienteId,
          procedimento_id: input.procedimentoId,
          profissional_id: input.profissionalId,
          sessao_cliente_id: input.sessaoClienteId,
          inicio_em: input.inicioEm,
          duracao_min: input.duracaoMin,
          preco_total: input.precoTotal,
          valor_sinal: input.valorSinal,
          estado: input.estado ?? 'agendado',
          ...(input.expiraEm ? { expira_em: input.expiraEm } : {}),
          ...(input.pagamentoNoSalao !== undefined
            ? { pagamento_no_salao: input.pagamentoNoSalao }
            : {}),
        })
        .returning();

      return agendamentosCriados[0];
    });
  }

  async concluir({
    id,
    salaoId,
    ocorreuEm,
    cobranca,
    lembrete: lembreteDaConclusao,
  }: ConcluirAgendamentoPersistenciaInput): Promise<
    AgendamentoPersistido | undefined
  > {
    return this.database.transaction(async (tx) => {
      // O estado no `where` é o desempate de corrida: a segunda conclusão
      // simultânea não encontra linha e nada é gravado.
      const agendamentosConcluidos = await tx
        .update(agendamento)
        .set({ estado: 'concluido' })
        .where(
          and(
            eq(agendamento.id, id),
            eq(agendamento.salao_id, salaoId),
            eq(agendamento.estado, 'agendado'),
          ),
        )
        .returning();

      const agendamentoConcluido = agendamentosConcluidos[0];

      if (!agendamentoConcluido) {
        return undefined;
      }

      await tx.insert(eventoAgendamento).values({
        agendamento_id: agendamentoConcluido.id,
        tipo: 'concluido',
        ocorreu_em: ocorreuEm,
      });

      if (cobranca) {
        const cobrancasCriadas = await tx
          .insert(cobrancaManual)
          .values({
            valor: cobranca.valor,
            metodo: cobranca.metodo,
            registrada_por: cobranca.registradaPor,
          })
          .returning({ id: cobrancaManual.id });

        await tx.insert(pagamentoAgendamento).values({
          agendamento_id: agendamentoConcluido.id,
          cobranca_manual_id: cobrancasCriadas[0].id,
          tipo: 'restante',
        });
      }

      if (lembreteDaConclusao) {
        await tx.insert(lembrete).values({
          cliente_id: agendamentoConcluido.cliente_id,
          agendamento_id: agendamentoConcluido.id,
          procedimento_id: agendamentoConcluido.procedimento_id,
          texto: lembreteDaConclusao.texto,
          data_alvo: lembreteDaConclusao.dataAlvo,
          origem: 'automatica',
          status: 'ativo',
        });
      }

      return agendamentoConcluido;
    });
  }

  async marcarFalta({
    id,
    salaoId,
    ocorreuEm,
  }: MarcarFaltaAgendamentoPersistenciaInput): Promise<
    AgendamentoPersistido | undefined
  > {
    return this.database.transaction(async (tx) => {
      // O estado no `where` é o desempate de corrida: a segunda marcação
      // simultânea não encontra linha e nada é gravado.
      const agendamentosMarcados = await tx
        .update(agendamento)
        .set({ estado: 'falta' })
        .where(
          and(
            eq(agendamento.id, id),
            eq(agendamento.salao_id, salaoId),
            eq(agendamento.estado, 'agendado'),
          ),
        )
        .returning();

      const agendamentoMarcado = agendamentosMarcados[0];

      if (!agendamentoMarcado) {
        return undefined;
      }

      await tx.insert(eventoAgendamento).values({
        agendamento_id: agendamentoMarcado.id,
        tipo: 'falta',
        ocorreu_em: ocorreuEm,
      });

      return agendamentoMarcado;
    });
  }

  async cancelar({
    id,
    salaoId,
    ocorreuEm,
    motivo,
    canceladoPor,
  }: CancelarAgendamentoPersistenciaInput): Promise<
    AgendamentoPersistido | undefined
  > {
    return this.database.transaction(async (tx) => {
      // Sair de `reservado`/`agendado` já libera o slot: é esse o conjunto que
      // o índice parcial e as consultas de ocupação consideram ocupado.
      const agendamentosCancelados = await tx
        .update(agendamento)
        .set({ estado: 'cancelado' })
        .where(
          and(
            eq(agendamento.id, id),
            eq(agendamento.salao_id, salaoId),
            inArray(agendamento.estado, ['agendado', 'reservado']),
          ),
        )
        .returning();

      const agendamentoCancelado = agendamentosCancelados[0];

      if (!agendamentoCancelado) {
        return undefined;
      }

      await tx.insert(eventoAgendamento).values({
        agendamento_id: agendamentoCancelado.id,
        tipo: 'cancelado',
        ocorreu_em: ocorreuEm,
        motivo,
        cancelado_por: canceladoPor,
      });

      await tx
        .update(cobrancaGateway)
        .set({ status: 'expirada' })
        .where(
          and(
            eq(cobrancaGateway.salao_id, salaoId),
            eq(cobrancaGateway.agendamento_id, agendamentoCancelado.id),
            inArray(cobrancaGateway.status, ['iniciando', 'pendente']),
          ),
        );

      return agendamentoCancelado;
    });
  }

  async remarcar({
    id,
    salaoId,
    profissionalId,
    dataAgendamento,
    inicioEm,
    duracaoMin,
    ocorreuEm,
  }: RemarcarAgendamentoPersistenciaInput): Promise<
    AgendamentoPersistido | undefined
  > {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${salaoId}:${dataAgendamento}`}))`,
      );

      const conflitos = await tx
        .select({ id: agendamento.id })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.salao_id, salaoId),
            eq(agendamento.profissional_id, profissionalId),
            ne(agendamento.id, id),
            condicaoDeSobreposicao({ inicioEm, duracaoMin }),
          ),
        )
        .limit(1);

      if (conflitos.length > 0) {
        return undefined;
      }

      const agendamentosRemarcados = await tx
        .update(agendamento)
        .set({ inicio_em: inicioEm })
        .where(
          and(
            eq(agendamento.id, id),
            eq(agendamento.salao_id, salaoId),
            eq(agendamento.estado, 'agendado'),
          ),
        )
        .returning();

      const agendamentoRemarcado = agendamentosRemarcados[0];

      if (!agendamentoRemarcado) {
        return undefined;
      }

      await tx.insert(eventoAgendamento).values({
        agendamento_id: agendamentoRemarcado.id,
        tipo: 'remarcado',
        ocorreu_em: ocorreuEm,
      });

      return agendamentoRemarcado;
    });
  }

  private selecionarAgenda() {
    return this.database
      .select({
        agendamento,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
        },
        procedimento: {
          id: procedimento.id,
          nome: procedimento.nome,
          periodo_manutencao_dias: procedimento.periodo_manutencao_dias,
        },
        valor_manual: cobrancaManual.valor,
        valor_gateway: sql<
          string | null
        >`coalesce(${pagamentoAgendamento.valor}, ${cobrancaGateway.valor})`,
        status_gateway: cobrancaGateway.status,
        quantidade_anexos: sql<number>`(
          select count(*)::int
          from ${anexoAgendamento}
          where ${anexoAgendamento.agendamento_id} = ${agendamento.id}
            and ${anexoAgendamento.visibilidade} = 'interna_do_salao'
        )`,
        tem_imagens_referencia: sql<boolean>`exists (
          select 1
          from ${anexoAgendamento}
          where ${anexoAgendamento.agendamento_id} = ${agendamento.id}
            and ${anexoAgendamento.visibilidade} = 'publica_para_cliente'
        )`,
        tem_observacoes: sql<boolean>`exists (select 1 from ${nota} where ${nota.agendamento_id} = ${agendamento.id})`,
      })
      .from(agendamento)
      .innerJoin(cliente, eq(cliente.id, agendamento.cliente_id))
      .innerJoin(procedimento, eq(procedimento.id, agendamento.procedimento_id))
      .leftJoin(
        pagamentoAgendamento,
        eq(pagamentoAgendamento.agendamento_id, agendamento.id),
      )
      .leftJoin(
        cobrancaManual,
        eq(cobrancaManual.id, pagamentoAgendamento.cobranca_manual_id),
      )
      .leftJoin(
        cobrancaGateway,
        eq(cobrancaGateway.id, pagamentoAgendamento.cobranca_gateway_id),
      );
  }

  private condicaoAgendamentoDoProcedimentoNoDia({
    salaoId,
    clienteId,
    procedimentoId,
    data,
    fusoHorario,
  }: PossuiAgendamentoDoProcedimentoNoDiaInput) {
    const inicioDia = dataHoraCivilParaUtc({
      data,
      hora: '00:00',
      fusoHorario,
    });
    const fimDia = dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    });

    return and(
      eq(agendamento.salao_id, salaoId),
      eq(agendamento.cliente_id, clienteId),
      eq(agendamento.procedimento_id, procedimentoId),
      or(
        eq(agendamento.estado, 'agendado'),
        and(
          eq(agendamento.estado, 'reservado'),
          gt(agendamento.expira_em, sql`now()`),
        ),
      ),
      gte(agendamento.inicio_em, inicioDia),
      lt(agendamento.inicio_em, fimDia),
    );
  }
}
