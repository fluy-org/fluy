import { z } from 'zod';
import { VISIBILIDADE_ANEXO } from './anexo_agendamento.enums.js';

export const anexoAgendamentoResponseSchema = z
  .object({
    id: z.uuid(),
    agendamento_id: z.uuid(),
    visibilidade: z.enum(VISIBILIDADE_ANEXO),
    mime_type: z.string(),
    tamanho_bytes: z.number().int().nonnegative(),
    criado_em: z.iso.datetime(),
  })
  .meta({ id: 'AnexoAgendamentoResponse' });

export const listaAnexosAgendamentoResponseSchema = z
  .object({
    anexos: z.array(anexoAgendamentoResponseSchema),
  })
  .meta({ id: 'ListaAnexosAgendamentoResponse' });

export const listarAnexosClienteQuerySchema = z
  .object({
    visibilidade: z.enum(VISIBILIDADE_ANEXO),
    cursor: z.string().optional(),
  })
  .meta({ id: 'ListarAnexosClienteQuery' });

export const listaAnexosClienteResponseSchema = z
  .object({
    itens: z.array(anexoAgendamentoResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: 'ListaAnexosClienteResponse' });
