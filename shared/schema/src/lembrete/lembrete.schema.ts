import { z } from 'zod';
import { textoNotaSchema } from '../nota/nota.schema.js';
import { FUSOS_HORARIOS_BRASIL } from '../salao/salao.enums.js';
import {
  ORIGEM_LEMBRETE,
  PERIODO_LEMBRETE,
  STATUS_LEMBRETE,
} from './lembrete.enums.js';

// Data civil no fuso do salão, sem conversão UTC.
const dataAlvoSchema = z.iso.date(
  'Informe uma data válida no formato YYYY-MM-DD.',
);

const clienteIdSchema = z.uuid('Informe uma cliente válida.');

const agendamentoIdSchema = z.uuid('Informe um agendamento válido.');

const fusoHorarioSchema = z.enum(FUSOS_HORARIOS_BRASIL);

export const criarLembreteSchema = z
  .object({
    cliente_id: clienteIdSchema,
    agendamento_id: agendamentoIdSchema.optional(),
    texto: textoNotaSchema,
    data_alvo: dataAlvoSchema,
  })
  .meta({ id: 'CriarLembrete' });

export const atualizarLembreteSchema = z
  .object({
    texto: textoNotaSchema.optional(),
    data_alvo: dataAlvoSchema.optional(),
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar o lembrete.',
  })
  .meta({ id: 'AtualizarLembrete' });

export const listarLembreteQuerySchema = z
  .object({
    periodo: z.enum(PERIODO_LEMBRETE).optional(),
    origem: z.enum(ORIGEM_LEMBRETE).optional(),
    busca: z.string().trim().optional(),
    cliente_id: clienteIdSchema.optional(),
    agendamento_id: agendamentoIdSchema.optional(),
    cursor: z.string().optional(),
  })
  .meta({ id: 'ListarLembreteQuery' });

export const lembreteResponseSchema = z
  .object({
    id: z.uuid(),
    texto: z.string(),
    data_alvo: z.iso.date(),
    origem: z.enum(ORIGEM_LEMBRETE),
    status: z.enum(STATUS_LEMBRETE),
    cliente: z.object({
      id: z.uuid(),
      nome: z.string(),
    }),
    agendamento_id: z.uuid().nullable(),
    criado_em: z.iso.datetime(),
    concluido_em: z.iso.datetime().nullable(),
  })
  .meta({ id: 'LembreteResponse' });

export const listaLembretesResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    itens: z.array(lembreteResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: 'ListaLembretesResponse' });
