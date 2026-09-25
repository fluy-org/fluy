import type { ListarClienteQueryDto } from '@fluy/schema';

export type FiltrosListaClientes = Omit<ListarClienteQueryDto, 'cursor'>;

export type EstadoPaginaClientes =
  | 'carregando'
  | 'erro'
  | 'vazio'
  | 'sem-resultados'
  | 'lista';

export type EstadoPaginaFicha = 'carregando' | 'erro' | 'ficha';
