import { and, asc, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import {
  agendamento,
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
  PagamentoDoAgendamentoPersistido,
  RemarcarAgendamentoPersistenciaInput,
} from '@/modules/agendamento/contracts';

type LinhaDaAgenda = {
  agendamento: AgendamentoPersistido;
  cliente: AgendamentoDaAgendaPersistido['cliente'];
  procedimento: AgendamentoDaAgendaPersistido['procedimento'];
  valor_manual: string | null;
  valor_gateway: string | null;
  status_gateway: PagamentoDoAgendamentoPersistido['status'];
  tem_observacoes: boolean;
};

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
          inArray(agendamento.estado, ['reservado', 'agendado']),
          gte(agendamento.inicio_em, inicioDia),
          lt(agendamento.inicio_em, fimDia),
          ignorarAgendamentoId
            ? ne(agendamento.id, ignorarAgendamentoId)
            : undefined,
        ),
      );
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

    const remarcacoes = await this.database
      .select({ id: eventoAgendamento.id })
      .from(eventoAgendamento)
      .where(
        and(
          eq(eventoAgendamento.agendamento_id, id),
          eq(eventoAgendamento.tipo, 'remarcado'),
        ),
      );

    return { ...agendamentoDaAgenda, remarcado_vezes: remarcacoes.length };
  }

  async criar(
    input: CriarAgendamentoComValidacaoInput,
  ): Promise<AgendamentoPersistido | undefined> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${input.salaoId}:${input.dataAgendamento}`}))`,
      );

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
          inicio_em: input.inicioEm,
          duracao_min: input.duracaoMin,
          preco_total: input.precoTotal,
          valor_sinal: input.valorSinal,
          estado: 'agendado',
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
      });

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
        valor_gateway: cobrancaGateway.valor,
        status_gateway: cobrancaGateway.status,
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
}

// O fim do agendamento candidato só existe somando `duracao_min` à coluna, e
// não há operador Drizzle para intervalo entre colunas.
function condicaoDeSobreposicao({
  inicioEm,
  duracaoMin,
}: {
  inicioEm: Date;
  duracaoMin: number;
}) {
  const fimEm = new Date(inicioEm.getTime() + duracaoMin * 60_000);

  return and(
    inArray(agendamento.estado, ['reservado', 'agendado']),
    lt(agendamento.inicio_em, fimEm),
    sql`${agendamento.inicio_em} + ${agendamento.duracao_min} * interval '1 minute' > ${inicioEm}::timestamptz`,
  );
}

function agruparAgendamentos(
  linhas: LinhaDaAgenda[],
): AgendamentoDaAgendaPersistido[] {
  const agendamentosPorId = new Map<string, AgendamentoDaAgendaPersistido>();

  for (const linha of linhas) {
    const pagamento = extrairPagamento(linha);
    const existente = agendamentosPorId.get(linha.agendamento.id);

    if (existente) {
      if (pagamento) {
        existente.pagamentos.push(pagamento);
      }

      continue;
    }

    agendamentosPorId.set(linha.agendamento.id, {
      ...linha.agendamento,
      cliente: linha.cliente,
      procedimento: linha.procedimento,
      pagamentos: pagamento ? [pagamento] : [],
      tem_observacoes: linha.tem_observacoes,
    });
  }

  return Array.from(agendamentosPorId.values());
}

function extrairPagamento(
  linha: LinhaDaAgenda,
): PagamentoDoAgendamentoPersistido | undefined {
  if (linha.valor_manual !== null) {
    return { valor: linha.valor_manual, status: null };
  }

  if (linha.valor_gateway !== null) {
    return { valor: linha.valor_gateway, status: linha.status_gateway };
  }

  return undefined;
}
