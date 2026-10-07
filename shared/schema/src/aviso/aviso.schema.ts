import { z } from 'zod';
import { TIPO_AVISO } from './aviso.enums.js';

const credencialSchema = z.uuid(
  'Informe uma credencial de dispositivo válida.',
);

export const listarAvisosQuerySchema = z
  .object({ cursor: z.string().optional() })
  .strict()
  .meta({ id: 'ListarAvisosQuery' });

export const listarAvisosPublicosQuerySchema = listarAvisosQuerySchema
  .extend({ credencial: credencialSchema })
  .meta({ id: 'ListarAvisosPublicosQuery' });

export const reconhecerAvisoPublicoSchema = z
  .object({ credencial: credencialSchema })
  .strict()
  .meta({ id: 'ReconhecerAvisoPublico' });

export const avisoResponseSchema = z
  .object({
    id: z.uuid(),
    tipo: z.enum(TIPO_AVISO),
    titulo: z.string(),
    mensagem: z.string(),
    agendamento_id: z.uuid().nullable(),
    criado_em: z.iso.datetime(),
    reconhecido_em: z.iso.datetime().nullable(),
  })
  .meta({ id: 'AvisoResponse' });

export const listaAvisosResponseSchema = z
  .object({
    itens: z.array(avisoResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: 'ListaAvisosResponse' });
