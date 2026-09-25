import type {
    ClienteFichaResponseDto,
    ClienteListaItemResponseDto,
    ClienteResponseDto,
    ListaAgendamentosClienteResponseDto,
    ListaClientesResponseDto,
} from '@fluy/schema';
import type {
    ClienteDaListaPersistido,
    ClienteFichaResultado,
    ClientePersistido,
    ListaAgendamentosClienteResultado,
    ListaClientesResultado,
} from '@/modules/cliente/contracts';

export function toClienteResponse(cliente: ClientePersistido,): ClienteResponseDto {
    return {
        id: cliente.id,
        nome: cliente.nome,
        whatsapp: cliente.whatsapp,
        observacoes: cliente.observacoes,
        ativo: cliente.removido_em === null,
        criada_em: cliente.criada_em.toISOString(),
    };
}

export function toListaClientesResponse({
    fusoHorario,
    itens,
    proximoCursor,
}: ListaClientesResultado): ListaClientesResponseDto {
    return {
        fuso_horario: fusoHorario,
        itens: itens.map(toClienteListaItemResponse),
        proximo_cursor: proximoCursor,
    };
}

export function toClienteFichaResponse({
    cliente,
    metricas,
    fusoHorario,
}: ClienteFichaResultado): ClienteFichaResponseDto {
    return {
        ...toClienteResponse(cliente),
        fuso_horario: fusoHorario,
        metricas: {
            total_gasto: Number(metricas.total_gasto ?? 0),
            total_agendamentos: metricas.total_agendamentos ?? 0,
            cancelamentos: metricas.cancelamentos ?? 0,
            faltas: metricas.faltas ?? 0,
            ultimo_atendimento_em:
                metricas.ultimo_atendimento_em?.toISOString() ?? null,
        },
    };
}

export function toAgendamentosDaClienteResponse({
    fusoHorario,
    itens,
    proximoCursor,
}: ListaAgendamentosClienteResultado): ListaAgendamentosClienteResponseDto {
    return {
        fuso_horario: fusoHorario,
        itens: itens.map((agendamento) => ({
            id: agendamento.id,
            inicio_em: agendamento.inicio_em.toISOString(),
            estado: agendamento.estado,
            procedimento: {
                id: agendamento.procedimento.id,
                nome: agendamento.procedimento.nome,
            },
            preco_total: Number(agendamento.preco_total),
        })),
        proximo_cursor: proximoCursor,
    };
}

function toClienteListaItemResponse(
    cliente: ClienteDaListaPersistido,
): ClienteListaItemResponseDto {
    return {
        ...toClienteResponse(cliente),
        ultimo_atendimento_em: cliente.ultimo_atendimento_em?.toISOString() ?? null,
    };
}
