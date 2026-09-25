import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { cliente, sessaoCliente } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { ClientePersistido, BuscarClienteInput, CriarClienteInput, AtualizarClienteInput, ListarClienteInput, IdentificarClientePublicaInput, ResolverSessaoClienteInput } from '@/modules/cliente/contracts';

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

    async resolverSessao(
        input: ResolverSessaoClienteInput,
    ): Promise<ClientePersistido | undefined> {
        return this.database.transaction(async (tx) => {
            const resultados = await tx
                .select({ cliente })
                .from(sessaoCliente)
                .innerJoin(cliente, eq(cliente.id, sessaoCliente.cliente_id))
                .where(and(
                    eq(sessaoCliente.tipo, 'uuid_dispositivo'),
                    eq(sessaoCliente.credencial, input.credencial),
                    eq(cliente.salao_id, input.salaoId),
                    isNull(cliente.removido_em),
                ))
                .limit(1);

            const clienteEncontrado = resultados[0]?.cliente;

            if (clienteEncontrado) {
                await tx
                    .update(sessaoCliente)
                    .set({ ultimo_uso_em: new Date() })
                    .where(and(
                        eq(sessaoCliente.tipo, 'uuid_dispositivo'),
                        eq(sessaoCliente.credencial, input.credencial),
                    ));
            }

            return clienteEncontrado;
        });
    }

    async identificarPublicamente(
        input: IdentificarClientePublicaInput,
    ): Promise<{ cliente?: ClientePersistido; conflitoCredencial: boolean }> {
        return this.database.transaction(async (tx) => {
            const existentes = await tx
                .select()
                .from(cliente)
                .where(and(
                    eq(cliente.salao_id, input.salaoId),
                    eq(cliente.whatsapp, input.dados.whatsapp),
                ))
                .limit(1);

            let clienteIdentificado = existentes[0];

            if (clienteIdentificado?.removido_em) {
                const reativados = await tx
                    .update(cliente)
                    .set({ removido_em: null })
                    .where(eq(cliente.id, clienteIdentificado.id))
                    .returning();
                clienteIdentificado = reativados[0];
            }

            if (!clienteIdentificado) {
                const criados = await tx
                    .insert(cliente)
                    .values({
                        salao_id: input.salaoId,
                        nome: input.dados.nome,
                        whatsapp: input.dados.whatsapp,
                    })
                    .onConflictDoNothing({
                        target: [cliente.salao_id, cliente.whatsapp],
                    })
                    .returning();

                clienteIdentificado = criados[0];

                if (!clienteIdentificado) {
                    const concorrente = await tx
                        .select()
                        .from(cliente)
                        .where(and(
                            eq(cliente.salao_id, input.salaoId),
                            eq(cliente.whatsapp, input.dados.whatsapp),
                        ))
                        .limit(1);
                    clienteIdentificado = concorrente[0];
                }
            }

            if (!clienteIdentificado) {
                return { conflitoCredencial: false };
            }

            const sessoesExistentes = await tx
                .select({ salaoId: cliente.salao_id })
                .from(sessaoCliente)
                .innerJoin(cliente, eq(cliente.id, sessaoCliente.cliente_id))
                .where(and(
                    eq(sessaoCliente.tipo, 'uuid_dispositivo'),
                    eq(sessaoCliente.credencial, input.dados.credencial),
                ))
                .limit(1);

            if (
                sessoesExistentes[0] &&
                sessoesExistentes[0].salaoId !== input.salaoId
            ) {
                return { conflitoCredencial: true };
            }

            await tx
                .insert(sessaoCliente)
                .values({
                    cliente_id: clienteIdentificado.id,
                    tipo: 'uuid_dispositivo',
                    credencial: input.dados.credencial,
                    ultimo_uso_em: new Date(),
                })
                .onConflictDoUpdate({
                    target: [sessaoCliente.tipo, sessaoCliente.credencial],
                    set: {
                        cliente_id: clienteIdentificado.id,
                        ultimo_uso_em: new Date(),
                    },
                });

            return { cliente: clienteIdentificado, conflitoCredencial: false };
        });
    }
}
