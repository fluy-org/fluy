import { and, desc, eq, exists, isNull } from 'drizzle-orm';
import { agendamento, cliente, nota } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarNotaInput,
  BuscarNotaInput,
  CriarNotaPersistenciaInput,
  ListarNotaPersistenciaInput,
  NotaPersistida,
  PossuiAgendamentoDaClienteInput,
} from '@/modules/nota/contracts';

@Injectable()
export class NotaRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  // `nota` não tem `salao_id`: o escopo do salão vem da cliente.
  async listar(input: ListarNotaPersistenciaInput): Promise<NotaPersistida[]> {
    const linhas = await this.database
      .select({ nota })
      .from(nota)
      .innerJoin(cliente, eq(cliente.id, nota.cliente_id))
      .where(
        and(
          eq(cliente.salao_id, input.salaoId),
          input.clienteId ? eq(nota.cliente_id, input.clienteId) : undefined,
          input.agendamentoId
            ? eq(nota.agendamento_id, input.agendamentoId)
            : undefined,
        ),
      )
      .orderBy(desc(nota.criada_em), desc(nota.id))
      .limit(input.limite)
      .offset(input.offset);

    return linhas.map((linha) => linha.nota);
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
  }: CriarNotaPersistenciaInput): Promise<NotaPersistida> {
    const notasCriadas = await this.database
      .insert(nota)
      .values({
        cliente_id: dados.cliente_id,
        agendamento_id: dados.agendamento_id,
        texto: dados.texto,
        autor_id: autorId,
      })
      .returning();

    return notasCriadas[0];
  }

  async buscarPorId(
    input: BuscarNotaInput,
  ): Promise<NotaPersistida | undefined> {
    const linhas = await this.database
      .select({ nota })
      .from(nota)
      .innerJoin(cliente, eq(cliente.id, nota.cliente_id))
      .where(
        and(
          eq(nota.id, input.id),
          eq(cliente.salao_id, input.salaoId),
          isNull(cliente.removido_em),
        ),
      )
      .limit(1);

    return linhas[0]?.nota;
  }

  async atualizar({
    id,
    salaoId,
    dados,
  }: AtualizarNotaInput): Promise<NotaPersistida | undefined> {
    const notasAtualizadas = await this.database
      .update(nota)
      .set({ texto: dados.texto })
      .where(and(eq(nota.id, id), this.pertenceACliente({ salaoId })))
      .returning();

    return notasAtualizadas[0];
  }

  async remover({ id, salaoId }: BuscarNotaInput): Promise<void> {
    await this.database
      .delete(nota)
      .where(and(eq(nota.id, id), this.pertenceACliente({ salaoId })));
  }

  // Ficha inativa é só leitura: editar e excluir exigem cliente ativa.
  private pertenceACliente({ salaoId }: { salaoId: string }) {
    return exists(
      this.database
        .select({ id: cliente.id })
        .from(cliente)
        .where(
          and(
            eq(cliente.id, nota.cliente_id),
            eq(cliente.salao_id, salaoId),
            isNull(cliente.removido_em),
          ),
        ),
    );
  }
}
