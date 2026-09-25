import type { z } from 'zod';
import type {
  consultarSessaoClienteSchema,
  identificarClientePublicaSchema,
  sessaoClientePublicaResponseSchema,
} from './sessao_cliente.schema.js';

export type ConsultarSessaoClienteDto = z.infer<
  typeof consultarSessaoClienteSchema
>;
export type IdentificarClientePublicaDto = z.infer<
  typeof identificarClientePublicaSchema
>;
export type SessaoClientePublicaResponseDto = z.infer<
  typeof sessaoClientePublicaResponseSchema
>;
