import { z } from 'zod';
import {
  AVISO_AVALIACAO_AGENDAMENTO,
  BLOQUEIO_AVALIACAO_AGENDAMENTO,
  ESTADO_AGENDAMENTO,
  STATUS_AVALIACAO_AGENDAMENTO,
} from './agendamento.enums.js';

const dataSchema = z.iso.date(
  'Informe uma data válida no formato YYYY-MM-DD.',
);

const horaSchema = z
  .string()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    'Informe um horário válido no formato HH:mm.',
  );

const procedimentoIdSchema = z.uuid('Informe um procedimento válido.');

export const listarHorariosLivresQuerySchema = z
  .object({
    procedimento_id: procedimentoIdSchema,
    data: dataSchema,
  })
  .strict()
  .meta({ id: 'ListarHorariosLivresQuery' });

export const avaliarHorarioAgendamentoQuerySchema = z
  .object({
    procedimento_id: procedimentoIdSchema,
    data: dataSchema,
    hora_inicio: horaSchema,
  })
  .strict()
  .meta({ id: 'AvaliarHorarioAgendamentoQuery' });

export const criarAgendamentoSchema = z
  .object({
    cliente_id: z.uuid('Informe uma cliente válida.'),
    procedimento_id: procedimentoIdSchema,
    data: dataSchema,
    hora_inicio: horaSchema,
    confirmar_excecoes: z.boolean().default(false),
  })
  .strict()
  .meta({ id: 'CriarAgendamento' });

export const horariosLivresResponseSchema = z
  .object({
    data: dataSchema,
    horarios: z.array(z.object({ hora_inicio: horaSchema })),
  })
  .meta({ id: 'HorariosLivresResponse' });

export const avaliacaoHorarioAgendamentoResponseSchema = z
  .object({
    status: z.enum(STATUS_AVALIACAO_AGENDAMENTO),
    avisos: z.array(z.enum(AVISO_AVALIACAO_AGENDAMENTO)),
    bloqueios: z.array(z.enum(BLOQUEIO_AVALIACAO_AGENDAMENTO)),
  })
  .meta({ id: 'AvaliacaoHorarioAgendamentoResponse' });

export const agendamentoResponseSchema = z
  .object({
    id: z.uuid(),
    profissional_id: z.uuid(),
    cliente_id: z.uuid(),
    procedimento_id: z.uuid(),
    inicio_em: z.iso.datetime(),
    duracao_min: z.number().int().positive(),
    preco_total: z.number().nonnegative(),
    valor_sinal: z.number().nonnegative(),
    estado: z.enum(ESTADO_AGENDAMENTO),
    criado_em: z.iso.datetime(),
  })
  .meta({ id: 'AgendamentoResponse' });
