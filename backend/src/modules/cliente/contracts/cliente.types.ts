import type {
    AtualizarClienteDto,
    cliente,
    CriarClienteDto,
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
