import { z } from 'zod';
import { METODO_PAGAMENTO_MANUAL } from '../cobranca_manual/cobranca_manual.enums.js';
import { FUSOS_HORARIOS_BRASIL } from '../salao/salao.enums.js';
import {
  ACAO_AGENDAMENTO,
  AVISO_ACAO_AGENDAMENTO,
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

export const concluirAgendamentoSchema = z
  .object({
    // `null` é a marcação explícita "não recebeu o valor pendente".
    metodo_pagamento: z.enum(METODO_PAGAMENTO_MANUAL).nullable(),
  })
  .strict()
  .meta({ id: 'ConcluirAgendamento' });

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

export const listarAgendaDiaQuerySchema = z
  .object({ data: dataSchema.optional() })
  .strict()
  .meta({ id: 'ListarAgendaDiaQuery' });

export const listarResumoAgendaQuerySchema = z
  .object({
    data_inicio: dataSchema,
    data_fim: dataSchema,
  })
  .strict()
  .superRefine(({ data_inicio, data_fim }, contexto) => {
    const inicio = new Date(`${data_inicio}T00:00:00.000Z`);
    const fim = new Date(`${data_fim}T00:00:00.000Z`);
    const duracaoEmDias = (fim.getTime() - inicio.getTime()) / 86_400_000 + 1;

    if (fim < inicio) {
      contexto.addIssue({
        code: 'custom',
        path: ['data_fim'],
        message: 'A data final deve ser igual ou posterior à data inicial.',
      });
      return;
    }

    if (duracaoEmDias > 31) {
      contexto.addIssue({
        code: 'custom',
        path: ['data_fim'],
        message: 'Informe um intervalo de no máximo 31 dias.',
      });
    }
  })
  .meta({ id: 'ListarResumoAgendaQuery' });

export const resumoAgendaResponseSchema = z
  .object({
    dias: z.array(
      z.object({
        data: dataSchema,
        total: z.number().int().positive(),
      }),
    ),
  })
  .meta({ id: 'ResumoAgendaResponse' });

const clienteDoAgendamentoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
});

const procedimentoDoAgendamentoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
});

const fusoHorarioSchema = z.enum(FUSOS_HORARIOS_BRASIL);

export const agendamentoAgendaResponseSchema = z
  .object({
    id: z.uuid(),
    inicio_em: z.iso.datetime(),
    duracao_min: z.number().int().positive(),
    estado: z.enum(ESTADO_AGENDAMENTO),
    cliente: clienteDoAgendamentoSchema,
    procedimento: procedimentoDoAgendamentoSchema,
    preco_total: z.number().nonnegative(),
    valor_sinal: z.number().nonnegative(),
    valor_pago: z.number().nonnegative(),
    valor_pendente: z.number().nonnegative(),
    tem_imagens_referencia: z.boolean(),
    tem_observacoes: z.boolean(),
  })
  .meta({ id: 'AgendamentoAgendaResponse' });

export const agendaDiaResponseSchema = z
  .object({
    data: dataSchema,
    fuso_horario: fusoHorarioSchema,
    agendamentos: z.array(agendamentoAgendaResponseSchema),
  })
  .meta({ id: 'AgendaDiaResponse' });

export const agendamentoDetalheResponseSchema = agendamentoAgendaResponseSchema
  .extend({
    fuso_horario: fusoHorarioSchema,
    cliente: clienteDoAgendamentoSchema.extend({ whatsapp: z.string() }),
    criado_em: z.iso.datetime(),
    acoes_permitidas: z.array(z.enum(ACAO_AGENDAMENTO)),
    avisos: z.array(z.enum(AVISO_ACAO_AGENDAMENTO)),
  })
  .meta({ id: 'AgendamentoDetalheResponse' });
