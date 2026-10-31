import type {
  CriarAgendamentoPublicoDto,
  ReservaPixResponseDto,
  IniciarPagamentoPixDto,
} from '@fluy/schema';
export type ContextoCheckout = {
  subdominio: string;
  vinculo: string;
  referenciasPendentes?: boolean;
  nomeProcedimento: string;
  reserva: ReservaPixResponseDto;
  tentativa?: IniciarPagamentoPixDto['modalidade'];
};
export type ReservarCheckoutInput = {
  subdominio: string;
  nomeProcedimento: string;
  dados: CriarAgendamentoPublicoDto;
};
