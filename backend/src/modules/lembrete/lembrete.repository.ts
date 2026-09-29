import {
  and,
  asc,
  eq,
  exists,
  gte,
  isNull,
  like,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { agendamento, cliente, lembrete } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarLembreteInput,
  BuscarLembreteInput,
  ConcluirLembretePersistenciaInput,
  CriarLembretePersistenciaInput,
  LembreteComClientePersistido,
  LembretePersistido,
  ListarLembretePersistenciaInput,
  PossuiAgendamentoDaClienteInput,
} from '@/modules/lembrete/contracts';
import {
  extrairDigitos,
  montarPadraoBuscaNome,
} from '@/shared/busca/busca.utils';

// `lembrete` não tem `salao_id`: o escopo do salão vem sempre da cliente.
@Injectable()
export class LembreteRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async listar(
    input: ListarLembretePersistenciaInput,
  ): Promise<LembreteComClientePersistido[]> {
    const linhas = await this.selecionarComCliente()
      .where(
        and(
          eq(cliente.salao_id, input.salaoId),
          eq(lembrete.status, 'ativo'),
          this.filtrarClienteInativa(input),
          input.clienteId
            ? eq(lembrete.cliente_id, input.clienteId)
            : undefined,
          input.agendamentoId
            ? eq(lembrete.agendamento_id, input.agendamentoId)
            : undefined,
          input.origem ? eq(lembrete.origem, input.origem) : undefined,
          input.janela.inicio
            ? gte(lembrete.data_alvo, input.janela.inicio)
            : undefined,
          input.janela.fim
            ? lte(lembrete.data_alvo, input.janela.fim)
            : undefined,
          this.filtrarBusca(input),
        ),
      )
      .orderBy(
        asc(lembrete.data_alvo),
        asc(lembrete.criado_em),
        asc(lembrete.id),
      )
      .limit(input.limite)
      .offset(input.offset);

    return linhas.map(({ lembrete, cliente }) => ({ ...lembrete, cliente }));
  }

  async buscarPorId(
    input: BuscarLembreteInput,
  ): Promise<LembreteComClientePersistido | undefined> {
    const linhas = await this.selecionarComCliente()
      .where(
        and(
          eq(lembrete.id, input.id),
          eq(cliente.salao_id, input.salaoId),
          isNull(cliente.removido_em),
        ),
      )
      .limit(1);
    const linha = linhas[0];

    return linha ? { ...linha.lembrete, cliente: linha.cliente } : undefined;
  }

  async possuiAgendamentoDaCliente(
    input: PossuiAgendamentoDaClienteInput,
  ): Promise<boolean> {
    const resultados = await this.database
      .select({ id: agendamento.id })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.id, input.agendamentoId),
          eq(agendamento.cliente_id, input.clienteId),
          eq(agendamento.salao_id, input.salaoId),
        ),
      )
      .limit(1);

    return resultados.length > 0;
  }

  async criar({
    dados,
    autorId,
  }: CriarLembretePersistenciaInput): Promise<LembretePersistido> {
    const lembretesCriados = await this.database
      .insert(lembrete)
      .values({
        cliente_id: dados.cliente_id,
        agendamento_id: dados.agendamento_id,
        texto: dados.texto,
        data_alvo: dados.data_alvo,
        origem: 'manual',
        status: 'ativo',
        autor_id: autorId,
      })
      .returning();

    return lembretesCriados[0];
  }

  async atualizar({
    id,
    salaoId,
    dados,
  }: AtualizarLembreteInput): Promise<LembretePersistido | undefined> {
    const lembretesAtualizados = await this.database
      .update(lembrete)
      .set(dados)
      .where(
        and(
          eq(lembrete.id, id),
          eq(lembrete.status, 'ativo'),
          this.pertenceACliente({ salaoId }),
        ),
      )
      .returning();

    return lembretesAtualizados[0];
  }

  async concluir({
    id,
    salaoId,
    concluidoEm,
  }: ConcluirLembretePersistenciaInput): Promise<
    LembretePersistido | undefined
  > {
    // O status no `where` é o desempate de corrida: a segunda conclusão
    // simultânea não encontra linha.
    const lembretesConcluidos = await this.database
      .update(lembrete)
      .set({ status: 'concluido', concluido_em: concluidoEm })
      .where(
        and(
          eq(lembrete.id, id),
          eq(lembrete.status, 'ativo'),
          this.pertenceACliente({ salaoId }),
        ),
      )
      .returning();

    return lembretesConcluidos[0];
  }

  async remover({ id, salaoId }: BuscarLembreteInput): Promise<void> {
    await this.database
      .delete(lembrete)
      .where(and(eq(lembrete.id, id), this.pertenceACliente({ salaoId })));
  }

  private selecionarComCliente() {
    return this.database
      .select({
        lembrete,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
        },
      })
      .from(lembrete)
      .innerJoin(cliente, eq(cliente.id, lembrete.cliente_id));
  }

  private pertenceACliente({ salaoId }: { salaoId: string }) {
    return exists(
      this.database
        .select({ id: cliente.id })
        .from(cliente)
        .where(
          and(
            eq(cliente.id, lembrete.cliente_id),
            eq(cliente.salao_id, salaoId),
            isNull(cliente.removido_em),
          ),
        ),
    );
  }

  // A aba some com os lembretes de cliente inativa; a ficha e o detalhe do
  // agendamento, que abrem em leitura, continuam mostrando.
  private filtrarClienteInativa({
    clienteId,
    agendamentoId,
  }: ListarLembretePersistenciaInput) {
    if (clienteId || agendamentoId) {
      return undefined;
    }

    return isNull(cliente.removido_em);
  }

  private filtrarBusca({ busca }: ListarLembretePersistenciaInput) {
    if (!busca) {
      return undefined;
    }

    const digitos = extrairDigitos({ termo: busca });

    return or(
      sql`unaccent(${cliente.nome}) ilike unaccent(${montarPadraoBuscaNome({ termo: busca })})`,
      digitos ? like(cliente.whatsapp, `%${digitos}%`) : undefined,
    );
  }
}
