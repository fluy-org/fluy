import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { cliente } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { ClientePersistido, BuscarClienteInput, CriarClienteInput, AtualizarClienteInput, ListarClienteInput } from '@/modules/cliente/contracts';

@Injectable()
export class ClienteRepository {
    constructor(@InjectDatabase() private readonly database: Database) { }

    listar(input: ListarClienteInput): Promise<ClientePersistido[]> {
        const filtroStatus = input.status === 'ativos'
            ? isNull(cliente.removido_em)
            : input.status === 'inativos'
                ? isNotNull(cliente.removido_em)
                : undefined;

        return this.database
            .select()
            .from(cliente)
            .where(
                and(
                    eq(cliente.salao_id, input.salaoId),
                    filtroStatus,
                ),
            )
            .orderBy(asc(cliente.nome));
    }

    async buscarPorId(
        input: BuscarClienteInput,
    ): Promise<ClientePersistido | undefined> {
        const resultados = await this.database
            .select()
            .from(cliente)
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                    isNull(cliente.removido_em),
                ),
            )
            .limit(1);

        return resultados[0];
    }

    async criar(input: CriarClienteInput): Promise<ClientePersistido> {
        const clientesCriados = await this.database
            .insert(cliente)
            .values({
                ...input.dados,
                salao_id: input.salaoId,
            })
            .returning();

        return clientesCriados[0];
    }

    async atualizar(input: AtualizarClienteInput): Promise<ClientePersistido | undefined> {
        const clientesAtualizados = await this.database
            .update(cliente)
            .set(input.dados)
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                    isNull(cliente.removido_em),
                ),
            )
            .returning();

        return clientesAtualizados[0];
    }

    async inativar(input: BuscarClienteInput): Promise<ClientePersistido | undefined> {
        const clientesRemovidos = await this.database
            .update(cliente)
            .set({
                removido_em: new Date(),
            })
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                    isNull(cliente.removido_em),
                ),
            )
            .returning();

        return clientesRemovidos[0];
    }

    async reativar(input: BuscarClienteInput): Promise<ClientePersistido | undefined> {
        const clientesReativados = await this.database
            .update(cliente)
            .set({ removido_em: null })
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                    isNotNull(cliente.removido_em),
                ),
            )
            .returning();

        return clientesReativados[0];
    }
}
