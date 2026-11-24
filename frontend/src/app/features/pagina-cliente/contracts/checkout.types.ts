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
  clienteWhatsapp?: string;
  reserva: ReservaPixResponseDto;
  tentativa?: IniciarPagamentoPixDto['modalidade'];
};
export type ReservarCheckoutInput = {
  subdominio: string;
  nomeProcedimento: string;
  clienteWhatsapp?: string;
  dados: CriarAgendamentoPublicoDto;
};
