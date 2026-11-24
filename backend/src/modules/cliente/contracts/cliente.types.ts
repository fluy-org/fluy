import type {
    AtualizarClienteDto,
    cliente,
    sessaoCliente,
    CriarClienteDto,
    EstadoAgendamento,
    FusoHorarioBrasil,
    OrdenacaoCliente,
    SegmentoCliente,
    StatusFiltroCliente,
    IdentificarClientePublicaDto,
} from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

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
    sessaoClienteId?: string;
};

export type ListarAgendamentosClientePersistenciaInput = BuscarClienteInput & {
    offset: number;
    limite: number;
    sessaoClienteId?: string;
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
    duracao_min: number;
    estado: EstadoAgendamento;
    preco_total: string;
    valor_sinal: string;
    valor_pago?: string;
    pagamento_no_salao?: boolean;
    procedimento: {
        id: string;
        nome: string;
    };
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

export type ResolverSessaoClienteInput = {
    credencial: string;
    salaoId: string;
};

export type RevogarSessaoClienteInput = {
    credencial: string;
    salaoId: string;
};

export type SessaoClientePersistida = typeof sessaoCliente.$inferSelect;

export type SessaoClientePublicaResultado = {
    cliente: ClientePersistido;
    sessao: SessaoClientePersistida;
    verificada: boolean;
    nomeExibicao: string;
};

export type IdentificarClientePublicaInput = {
    dados: IdentificarClientePublicaDto;
    salaoId: string;
};
