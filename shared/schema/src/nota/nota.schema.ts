import { z } from 'zod';
import { FUSOS_HORARIOS_BRASIL } from '../salao/salao.enums.js';

export const textoNotaSchema = z
  .string()
  .trim()
  .min(1, 'Informe o texto.')
  .max(2000, 'O texto deve ter no máximo 2000 caracteres.');

const clienteIdSchema = z.uuid('Informe uma cliente válida.');

const agendamentoIdSchema = z.uuid('Informe um agendamento válido.');

const fusoHorarioSchema = z.enum(FUSOS_HORARIOS_BRASIL);

export const criarNotaSchema = z
  .object({
    cliente_id: clienteIdSchema,
    agendamento_id: agendamentoIdSchema.optional(),
    texto: textoNotaSchema,
  })
  .meta({ id: 'CriarNota' });

// Só o texto muda: a nota continua presa à cliente e ao agendamento de origem.
export const atualizarNotaSchema = z
  .object({
    texto: textoNotaSchema,
  })
  .meta({ id: 'AtualizarNota' });

export const listarNotaQuerySchema = z
  .object({
    cliente_id: clienteIdSchema.optional(),
    agendamento_id: agendamentoIdSchema.optional(),
    cursor: z.string().optional(),
  })
  .refine(
    (query) =>
      (query.cliente_id === undefined) !== (query.agendamento_id === undefined),
    { message: 'Informe a cliente ou o agendamento, apenas um deles.' },
  )
  .meta({ id: 'ListarNotaQuery' });

export const notaResponseSchema = z
  .object({
    id: z.uuid(),
    cliente_id: z.uuid(),
    agendamento_id: z.uuid().nullable(),
    texto: z.string(),
    criada_em: z.iso.datetime(),
  })
  .meta({ id: 'NotaResponse' });

export const listaNotasResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    itens: z.array(notaResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: 'ListaNotasResponse' });
