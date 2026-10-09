import { agendamento, anexoAgendamento, arquivo } from '@fluy/schema';
import { and, asc, desc, eq, exists, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import {
  LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO,
  LIMITE_REFERENCIAS_POR_AGENDAMENTO,
} from '@/modules/anexo-agendamento/anexo-agendamento-data';
import type {
  AnexoAgendamentoComArquivoPersistido,
  BuscarAnexoInternoInput,
  BuscarReferenciaDaClienteInput,
  BuscarReferenciaDoSalaoInput,
  BuscarAnexoDaClientePeloSalaoInput,
  CriarAnexoInternoPersistenciaInput,
  CriarAnexoInternoPersistenciaResultado,
  CriarReferenciaPersistenciaInput,
  CriarReferenciaPersistenciaResultado,
  EscopoAgendamentoDaCliente,
  EscopoAgendamentoDoSalao,
  ListarAnexosClientePersistenciaInput,
} from '@/modules/anexo-agendamento/contracts';

@Injectable()
export class AnexoAgendamentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async possuiAgendamentoDoSalao({
    agendamentoId,
    salaoId,
  }: EscopoAgendamentoDoSalao): Promise<boolean> {
    const agendamentos = await this.database
      .select({ id: agendamento.id })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
        ),
      )
      .limit(1);

    return agendamentos.length > 0;
  }

  async possuiAgendamentoDaCliente({
    agendamentoId,
    clienteId,
    salaoId,
  }: EscopoAgendamentoDaCliente): Promise<boolean> {
    const agendamentos = await this.database
      .select({ id: agendamento.id })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.id, agendamentoId),
          eq(agendamento.cliente_id, clienteId),
          eq(agendamento.salao_id, salaoId),
        ),
      )
      .limit(1);

    return agendamentos.length > 0;
  }

  listarInternos({
    agendamentoId,
    salaoId,
  }: EscopoAgendamentoDoSalao): Promise<
    AnexoAgendamentoComArquivoPersistido[]
  > {
    return this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(anexoAgendamento.visibilidade, 'interna_do_salao'),
        ),
      )
      .orderBy(asc(anexoAgendamento.criado_em), asc(anexoAgendamento.id));
  }

  listarReferenciasDoSalao({
    agendamentoId,
    salaoId,
  }: EscopoAgendamentoDoSalao): Promise<
    AnexoAgendamentoComArquivoPersistido[]
  > {
    return this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(anexoAgendamento.visibilidade, 'publica_para_cliente'),
        ),
      )
      .orderBy(asc(anexoAgendamento.criado_em), asc(anexoAgendamento.id));
  }

  listarReferenciasDaCliente({
    agendamentoId,
    salaoId,
    clienteId,
  }: EscopoAgendamentoDaCliente): Promise<
    AnexoAgendamentoComArquivoPersistido[]
  > {
    return this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(agendamento.cliente_id, clienteId),
          eq(anexoAgendamento.visibilidade, 'publica_para_cliente'),
        ),
      )
      .orderBy(asc(anexoAgendamento.criado_em), asc(anexoAgendamento.id));
  }

  async buscarInterno({
    id,
    agendamentoId,
    salaoId,
  }: BuscarAnexoInternoInput): Promise<
    AnexoAgendamentoComArquivoPersistido | undefined
  > {
    const anexos = await this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.id, id),
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(anexoAgendamento.visibilidade, 'interna_do_salao'),
        ),
      )
      .limit(1);

    return anexos[0];
  }

  async buscarReferenciaDaCliente({
    id,
    agendamentoId,
    salaoId,
    clienteId,
  }: BuscarReferenciaDaClienteInput): Promise<
    AnexoAgendamentoComArquivoPersistido | undefined
  > {
    const anexos = await this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.id, id),
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(agendamento.cliente_id, clienteId),
          eq(anexoAgendamento.visibilidade, 'publica_para_cliente'),
        ),
      )
      .limit(1);

    return anexos[0];
  }

  async buscarReferenciaDoSalao({
    id,
    agendamentoId,
    salaoId,
  }: BuscarReferenciaDoSalaoInput): Promise<
    AnexoAgendamentoComArquivoPersistido | undefined
  > {
    const anexos = await this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.id, id),
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(agendamento.salao_id, salaoId),
          eq(anexoAgendamento.visibilidade, 'publica_para_cliente'),
        ),
      )
      .limit(1);

    return anexos[0];
  }

  listarDaCliente({
    clienteId,
    limite,
    offset,
    salaoId,
    visibilidade,
  }: ListarAnexosClientePersistenciaInput): Promise<
    AnexoAgendamentoComArquivoPersistido[]
  > {
    return this.selecionarAnexos()
      .where(
        and(
          eq(agendamento.cliente_id, clienteId),
          eq(agendamento.salao_id, salaoId),
          eq(anexoAgendamento.visibilidade, visibilidade),
        ),
      )
      .orderBy(desc(anexoAgendamento.criado_em), desc(anexoAgendamento.id))
      .limit(limite)
      .offset(offset);
  }

  async buscarDaClientePeloSalao({
    id,
    clienteId,
    salaoId,
  }: BuscarAnexoDaClientePeloSalaoInput): Promise<
    AnexoAgendamentoComArquivoPersistido | undefined
  > {
    const anexos = await this.selecionarAnexos()
      .where(
        and(
          eq(anexoAgendamento.id, id),
          eq(agendamento.cliente_id, clienteId),
          eq(agendamento.salao_id, salaoId),
        ),
      )
      .limit(1);

    return anexos[0];
  }

  async criarInterno(
    input: CriarAnexoInternoPersistenciaInput,
  ): Promise<CriarAnexoInternoPersistenciaResultado> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`anexo-agendamento:${input.agendamentoId}`}))`,
      );

      const agendamentos = await tx
        .select({ id: agendamento.id })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.id, input.agendamentoId),
            eq(agendamento.salao_id, input.salaoId),
          ),
        )
        .limit(1);

      if (agendamentos.length === 0) {
        return { status: 'agendamento_nao_encontrado' };
      }

      const arquivos = await tx
        .select({ id: arquivo.id })
        .from(arquivo)
        .where(
          and(
            eq(arquivo.id, input.arquivo.id),
            eq(arquivo.salao_id, input.salaoId),
          ),
        )
        .limit(1);

      if (arquivos.length === 0) {
        return { status: 'arquivo_nao_encontrado' };
      }

      const anexosAtuais = await tx
        .select({ id: anexoAgendamento.id })
        .from(anexoAgendamento)
        .where(
          and(
            eq(anexoAgendamento.agendamento_id, input.agendamentoId),
            eq(anexoAgendamento.visibilidade, 'interna_do_salao'),
          ),
        )
        .limit(LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO);

      if (anexosAtuais.length >= LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO) {
        return { status: 'limite_atingido' };
      }

      const anexosCriados = await tx
        .insert(anexoAgendamento)
        .values({
          agendamento_id: input.agendamentoId,
          arquivo_id: input.arquivo.id,
          visibilidade: 'interna_do_salao',
        })
        .returning();

      return {
        status: 'criado',
        anexo: {
          ...anexosCriados[0],
          arquivo: input.arquivo,
        },
      };
    });
  }

  async criarReferencia(
    input: CriarReferenciaPersistenciaInput,
  ): Promise<CriarReferenciaPersistenciaResultado> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`referencia-agendamento:${input.agendamentoId}`}))`,
      );

      const agendamentos = await tx
        .select({ id: agendamento.id })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.id, input.agendamentoId),
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.cliente_id, input.clienteId),
          ),
        )
        .limit(1);

      if (agendamentos.length === 0) {
        return { status: 'agendamento_nao_encontrado' };
      }

      const arquivos = await tx
        .select({ id: arquivo.id })
        .from(arquivo)
        .where(
          and(
            eq(arquivo.id, input.arquivo.id),
            eq(arquivo.salao_id, input.salaoId),
          ),
        )
        .limit(1);

      if (arquivos.length === 0) {
        return { status: 'arquivo_nao_encontrado' };
      }

      const referenciasAtuais = await tx
        .select({ id: anexoAgendamento.id })
        .from(anexoAgendamento)
        .where(
          and(
            eq(anexoAgendamento.agendamento_id, input.agendamentoId),
            eq(anexoAgendamento.visibilidade, 'publica_para_cliente'),
          ),
        )
        .limit(LIMITE_REFERENCIAS_POR_AGENDAMENTO);

      if (referenciasAtuais.length >= LIMITE_REFERENCIAS_POR_AGENDAMENTO) {
        return { status: 'limite_atingido' };
      }

      const anexosCriados = await tx
        .insert(anexoAgendamento)
        .values({
          agendamento_id: input.agendamentoId,
          arquivo_id: input.arquivo.id,
          visibilidade: 'publica_para_cliente',
        })
        .returning();

      return {
        status: 'criado',
        anexo: { ...anexosCriados[0], arquivo: input.arquivo },
      };
    });
  }

  async removerInterno({
    id,
    agendamentoId,
    salaoId,
  }: BuscarAnexoInternoInput): Promise<void> {
    const agendamentoDoSalao = this.database
      .select({ id: agendamento.id })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.id, anexoAgendamento.agendamento_id),
          eq(agendamento.salao_id, salaoId),
        ),
      );

    await this.database
      .delete(anexoAgendamento)
      .where(
        and(
          eq(anexoAgendamento.id, id),
          eq(anexoAgendamento.agendamento_id, agendamentoId),
          eq(anexoAgendamento.visibilidade, 'interna_do_salao'),
          exists(agendamentoDoSalao),
        ),
      );
  }

  private selecionarAnexos() {
    return this.database
      .select({
        id: anexoAgendamento.id,
        agendamento_id: anexoAgendamento.agendamento_id,
        arquivo_id: anexoAgendamento.arquivo_id,
        visibilidade: anexoAgendamento.visibilidade,
        criado_em: anexoAgendamento.criado_em,
        arquivo: {
          id: arquivo.id,
          mime_type: arquivo.mime_type,
          tamanho_bytes: arquivo.tamanho_bytes,
          url_storage: arquivo.url_storage,
        },
      })
      .from(anexoAgendamento)
      .innerJoin(
        agendamento,
        eq(agendamento.id, anexoAgendamento.agendamento_id),
      )
      .innerJoin(arquivo, eq(arquivo.id, anexoAgendamento.arquivo_id));
  }
}
