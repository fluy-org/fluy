import { and, asc, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import {
  agendamento,
  cliente,
  cobrancaGateway,
  cobrancaManual,
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
  AgendamentoPersistido,
  BuscarAgendamentoInput,
  CriarAgendamentoComValidacaoInput,
  InstanteDeAgendamentoPersistido,
  ListarAgendamentosDoDiaInput,
  ListarInstantesDoPeriodoInput,
  OcupacaoProfissional,
  PagamentoDoAgendamentoPersistido,
} from '@/modules/agendamento/contracts';

type LinhaDaAgenda = {
  agendamento: AgendamentoPersistido;
  cliente: AgendamentoDaAgendaPersistido['cliente'];
  procedimento: AgendamentoDaAgendaPersistido['procedimento'];
  valor_manual: string | null;
  valor_gateway: string | null;
  status_gateway: PagamentoDoAgendamentoPersistido['status'];
};

@Injectable()
export class AgendamentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarClienteAtivo({
    clienteId,
    salaoId,
  }: {
    clienteId: string;
    salaoId: string;
  }): Promise<boolean> {
    const clientes = await this.database
      .select({ id: cliente.id })
      .from(cliente)
      .where(
        and(
          eq(cliente.id, clienteId),
          eq(cliente.salao_id, salaoId),
          isNull(cliente.removido_em),
        ),
      )
      .limit(1);

    return clientes.length > 0;
  }

  listarOcupacoesDoDia({
    salaoId,
    data,
    fusoHorario,
  }: {
    salaoId: string;
    data: string;
    fusoHorario: string;
  }): Promise<OcupacaoProfissional[]> {
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
    AgendamentoDaAgendaPersistido | undefined
  > {
    const linhas = await this.selecionarAgenda().where(
      and(eq(agendamento.id, id), eq(agendamento.salao_id, salaoId)),
    );

    return agruparAgendamentos(linhas)[0];
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
            inArray(agendamento.estado, ['reservado', 'agendado']),
            sql`${agendamento.inicio_em} < ${input.inicioEm}::timestamptz + ${input.duracaoMin} * interval '1 minute'`,
            sql`${agendamento.inicio_em} + ${agendamento.duracao_min} * interval '1 minute' > ${input.inicioEm}::timestamptz`,
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
        },
        valor_manual: cobrancaManual.valor,
        valor_gateway: cobrancaGateway.valor,
        status_gateway: cobrancaGateway.status,
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
