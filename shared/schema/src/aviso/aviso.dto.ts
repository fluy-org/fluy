import type { z } from 'zod';
import type {
  avisoResponseSchema,
  listaAvisosResponseSchema,
  listarAvisosPublicosQuerySchema,
  listarAvisosQuerySchema,
  reconhecerAvisoPublicoSchema,
} from './aviso.schema.js';

export type ListarAvisosQueryDto = z.infer<typeof listarAvisosQuerySchema>;
export type ListarAvisosPublicosQueryDto = z.infer<
  typeof listarAvisosPublicosQuerySchema
>;
export type ReconhecerAvisoPublicoDto = z.infer<
  typeof reconhecerAvisoPublicoSchema
>;
export type AvisoResponseDto = z.infer<typeof avisoResponseSchema>;
export type ListaAvisosResponseDto = z.infer<typeof listaAvisosResponseSchema>;
