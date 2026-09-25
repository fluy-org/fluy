import type {
    AtualizarClienteDto,
    cliente,
    CriarClienteDto,
    EstadoAgendamento,
    FusoHorarioBrasil,
    OrdenacaoCliente,
    SegmentoCliente,
    StatusFiltroCliente,
} from '@fluy/schema';


export type ClientePersistido = typeof cliente.$inferSelect;
export type BuscarClienteInput = {
    id: string;
    salaoId: string;
};

export type ListarClienteInput = {
    salaoId: string;
    status: StatusFiltroCliente;
    segmento: SegmentoCliente;
    ordenacao: OrdenacaoCliente;
    busca?: string;
    cursor?: string;
};

export type ListarClientePersistenciaInput = Omit<ListarClienteInput, 'cursor'> & {
    agora: Date;
    janelaRecenteDesde: Date;
    offset: number;
    limite: number;
};

export type CriarClienteInput = {
    dados: CriarClienteDto;
    salaoId: string;
};

export type AtualizarClienteInput = {
    dados: AtualizarClienteDto;
    id: string;
    salaoId: string;
};

export type ListarAgendamentosClienteInput = BuscarClienteInput & {
    cursor?: string;
};

export type ListarAgendamentosClientePersistenciaInput = BuscarClienteInput & {
    offset: number;
    limite: number;
};

export type ClienteDaListaPersistido = ClientePersistido & {
    ultimo_atendimento_em: Date | null;
};

export type MetricasClientePersistidas = {
    total_gasto: string | null;
    total_agendamentos: number | null;
    cancelamentos: number | null;
    faltas: number | null;
    ultimo_atendimento_em: Date | null;
};

export type ClienteFichaPersistido = {
    cliente: ClientePersistido;
    metricas: MetricasClientePersistidas;
};

export type AgendamentoDaClientePersistido = {
    id: string;
    inicio_em: Date;
    estado: EstadoAgendamento;
    preco_total: string;
    procedimento: {
        id: string;
        nome: string;
    };
};

export type PaginaResultado<T> = {
    itens: T[];
    proximoCursor: string | null;
};

export type ListaClientesResultado = PaginaResultado<ClienteDaListaPersistido> & {
    fusoHorario: FusoHorarioBrasil;
};

export type ClienteFichaResultado = ClienteFichaPersistido & {
    fusoHorario: FusoHorarioBrasil;
};

export type ListaAgendamentosClienteResultado =
    PaginaResultado<AgendamentoDaClientePersistido> & {
        fusoHorario: FusoHorarioBrasil;
    };
