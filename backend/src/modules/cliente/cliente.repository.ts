import {
    and,
    asc,
    desc,
    eq,
    exists,
    gte,
    isNotNull,
    isNull,
    like,
    lte,
    or,
    sql,
} from 'drizzle-orm';
import {
    agendamento,
    cliente,
    cobrancaGateway,
    cobrancaManual,
    pagamentoAgendamento,
    procedimento,
    reembolso,
    sessaoCliente,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import {
    extrairDigitos,
    montarPadraoBuscaNome,
} from '@/shared/busca/busca.utils';
import type {
    AgendamentoDaClientePersistido,
    AtualizarClienteInput,
    BuscarClienteInput,
    ClienteDaListaPersistido,
    ClienteFichaPersistido,
    ClientePersistido,
    CriarClienteInput,
    IdentificarClientePublicaInput,
    ListarAgendamentosClientePersistenciaInput,
    ListarClientePersistenciaInput,
    ResolverSessaoClienteInput,
} from '@/modules/cliente/contracts';

@Injectable()
export class ClienteRepository {
    constructor(@InjectDatabase() private readonly database: Database) { }

    async listar(
        input: ListarClientePersistenciaInput,
    ): Promise<ClienteDaListaPersistido[]> {
        const resumo = this.selecionarResumoAgendamentos({
            salaoId: input.salaoId,
        });
        const gasto = this.selecionarTotalGasto({ salaoId: input.salaoId });

        const linhas = await this.database
            .select({
                cliente,
                ultimo_atendimento_em: resumo.ultimo_atendimento_em,
            })
            .from(cliente)
            .leftJoin(resumo, eq(resumo.cliente_id, cliente.id))
            .leftJoin(gasto, eq(gasto.cliente_id, cliente.id))
            .where(
                and(
                    eq(cliente.salao_id, input.salaoId),
                    this.filtrarStatus(input),
                    this.filtrarSegmento(input),
                    this.filtrarBusca(input),
                ),
            )
            .orderBy(
                ...(input.ordenacao === 'ultimo_atendimento'
                    ? [sql`${resumo.ultimo_atendimento_em} desc nulls last`]
                    : input.ordenacao === 'maior_valor_gasto'
                        ? [sql`coalesce(${gasto.total_gasto}, 0) desc`]
                        : [sql`unaccent(lower(${cliente.nome})) asc`]),
                asc(cliente.id),
            )
            .limit(input.limite)
            .offset(input.offset);

        return linhas.map((linha) => ({
            ...linha.cliente,
            ultimo_atendimento_em: linha.ultimo_atendimento_em,
        }));
    }

    async buscarFicha(
        input: BuscarClienteInput,
    ): Promise<ClienteFichaPersistido | undefined> {
        const escopo = { salaoId: input.salaoId, clienteId: input.id };
        const resumo = this.selecionarResumoAgendamentos(escopo);
        const gasto = this.selecionarTotalGasto(escopo);

        const linhas = await this.database
            .select({
                cliente,
                total_gasto: gasto.total_gasto,
                total_agendamentos: resumo.total_agendamentos,
                cancelamentos: resumo.cancelamentos,
                faltas: resumo.faltas,
                ultimo_atendimento_em: resumo.ultimo_atendimento_em,
            })
            .from(cliente)
            .leftJoin(resumo, eq(resumo.cliente_id, cliente.id))
            .leftJoin(gasto, eq(gasto.cliente_id, cliente.id))
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                ),
            )
            .limit(1);
        const linha = linhas[0];

        if (!linha) {
            return undefined;
        }

        return {
            cliente: linha.cliente,
            metricas: {
                total_gasto: linha.total_gasto,
                total_agendamentos: linha.total_agendamentos,
                cancelamentos: linha.cancelamentos,
                faltas: linha.faltas,
                ultimo_atendimento_em: linha.ultimo_atendimento_em,
            },
        };
    }

    async possuiCliente(input: BuscarClienteInput): Promise<boolean> {
        const resultados = await this.database
            .select({ id: cliente.id })
            .from(cliente)
            .where(
                and(
                    eq(cliente.id, input.id),
                    eq(cliente.salao_id, input.salaoId),
                ),
            )
            .limit(1);

        return resultados.length > 0;
    }

    listarAgendamentos(
        input: ListarAgendamentosClientePersistenciaInput,
    ): Promise<AgendamentoDaClientePersistido[]> {
        return this.database
            .select({
                id: agendamento.id,
                inicio_em: agendamento.inicio_em,
                estado: agendamento.estado,
                preco_total: agendamento.preco_total,
                procedimento: {
                    id: procedimento.id,
                    nome: procedimento.nome,
                },
            })
            .from(agendamento)
            .innerJoin(
                procedimento,
                eq(procedimento.id, agendamento.procedimento_id),
            )
            .where(
                and(
                    eq(agendamento.cliente_id, input.id),
                    eq(agendamento.salao_id, input.salaoId),
                ),
            )
            .orderBy(desc(agendamento.inicio_em), desc(agendamento.id))
            .limit(input.limite)
            .offset(input.offset);
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

    private filtrarStatus({ status }: ListarClientePersistenciaInput) {
        if (status === 'ativos') {
            return isNull(cliente.removido_em);
        }

        return status === 'inativos' ? isNotNull(cliente.removido_em) : undefined;
    }

    private filtrarSegmento({
        salaoId,
        segmento,
        agora,
        janelaRecenteDesde,
    }: ListarClientePersistenciaInput) {
        if (segmento === 'novas') {
            return and(
                gte(cliente.criada_em, janelaRecenteDesde),
                lte(cliente.criada_em, agora),
            );
        }

        if (segmento === 'atendidas_30_dias') {
            return exists(
                this.database
                    .select({ id: agendamento.id })
                    .from(agendamento)
                    .where(
                        and(
                            eq(agendamento.cliente_id, cliente.id),
                            eq(agendamento.salao_id, salaoId),
                            eq(agendamento.estado, 'concluido'),
                            gte(agendamento.inicio_em, janelaRecenteDesde),
                            lte(agendamento.inicio_em, agora),
                        ),
                    ),
            );
        }

        return undefined;
    }

    private filtrarBusca({ busca }: ListarClientePersistenciaInput) {
        if (!busca) {
            return undefined;
        }

        const digitos = extrairDigitos({ termo: busca });

        return or(
            sql`unaccent(${cliente.nome}) ilike unaccent(${montarPadraoBuscaNome({ termo: busca })})`,
            digitos ? like(cliente.whatsapp, `%${digitos}%`) : undefined,
        );
    }

    private selecionarResumoAgendamentos({
        salaoId,
        clienteId,
    }: {
        salaoId: string;
        clienteId?: string;
    }) {
        return this.database
            .select({
                cliente_id: agendamento.cliente_id,
                ultimo_atendimento_em: sql<Date | null>`max(${agendamento.inicio_em}) filter (where ${agendamento.estado} = 'concluido')`
                    .mapWith(agendamento.inicio_em)
                    .as('ultimo_atendimento_em'),
                total_agendamentos: sql<number>`count(*) filter (where ${agendamento.estado} <> 'reservado')`
                    .mapWith(Number)
                    .as('total_agendamentos'),
                cancelamentos: sql<number>`count(*) filter (where ${agendamento.estado} = 'cancelado')`
                    .mapWith(Number)
                    .as('cancelamentos'),
                faltas: sql<number>`count(*) filter (where ${agendamento.estado} = 'falta')`
                    .mapWith(Number)
                    .as('faltas'),
            })
            .from(agendamento)
            .where(
                and(
                    eq(agendamento.salao_id, salaoId),
                    clienteId ? eq(agendamento.cliente_id, clienteId) : undefined,
                ),
            )
            .groupBy(agendamento.cliente_id)
            .as('resumo_agendamentos');
    }

    // Total gasto segue a regra do "total faturado": só o que entrou de fato
    // (manual sempre, gateway só confirmada), menos reembolsos confirmados.
    private selecionarTotalGasto({
        salaoId,
        clienteId,
    }: {
        salaoId: string;
        clienteId?: string;
    }) {
        return this.database
            .select({
                cliente_id: agendamento.cliente_id,
                total_gasto: sql<string>`sum(
                    coalesce(
                        ${cobrancaManual.valor},
                        case when ${cobrancaGateway.status} = 'confirmada' then ${cobrancaGateway.valor} end,
                        0
                    )
                    - coalesce((
                        select sum(${reembolso.valor})
                        from ${reembolso}
                        where ${reembolso.confirmado_em} is not null
                          and (
                            ${reembolso.cobranca_manual_id} = ${pagamentoAgendamento.cobranca_manual_id}
                            or ${reembolso.cobranca_gateway_id} = ${pagamentoAgendamento.cobranca_gateway_id}
                          )
                    ), 0)
                )`.as('total_gasto'),
            })
            .from(pagamentoAgendamento)
            .innerJoin(
                agendamento,
                eq(agendamento.id, pagamentoAgendamento.agendamento_id),
            )
            .leftJoin(
                cobrancaManual,
                eq(cobrancaManual.id, pagamentoAgendamento.cobranca_manual_id),
            )
            .leftJoin(
                cobrancaGateway,
                eq(cobrancaGateway.id, pagamentoAgendamento.cobranca_gateway_id),
            )
            .where(
                and(
                    eq(agendamento.salao_id, salaoId),
                    clienteId ? eq(agendamento.cliente_id, clienteId) : undefined,
                ),
            )
            .groupBy(agendamento.cliente_id)
            .as('total_gasto_cliente');
    }
}
