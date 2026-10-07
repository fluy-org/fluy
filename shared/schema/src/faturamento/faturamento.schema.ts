import { z } from 'zod';
import { METODO_PAGAMENTO_GATEWAY } from '../cobranca_gateway/cobranca_gateway.enums.js';
import { METODO_PAGAMENTO_MANUAL } from '../cobranca_manual/cobranca_manual.enums.js';
import { FUSOS_HORARIOS_BRASIL } from '../salao/salao.enums.js';
import {
  MOTIVO_SINAL_RETIDO,
  ORIGEM_PAGAMENTO,
  PRESET_PERIODO_FATURAMENTO,
} from './faturamento.enums.js';

const dataSchema = z.iso.date(
  'Informe uma data válida no formato YYYY-MM-DD.',
);

const fusoHorarioSchema = z.enum(FUSOS_HORARIOS_BRASIL);

const valorSchema = z.number().nonnegative();

const periodoFaturamentoQuerySchema = z
  .object({
    periodo: z.enum(PRESET_PERIODO_FATURAMENTO).optional(),
    data_inicio: dataSchema.optional(),
    data_fim: dataSchema.optional(),
  })
  .strict();

function validarPeriodoFaturamento(
  {
    periodo,
    data_inicio,
    data_fim,
  }: z.infer<typeof periodoFaturamentoQuerySchema>,
  contexto: z.RefinementCtx,
) {
  if (periodo) {
    if (data_inicio || data_fim) {
      contexto.addIssue({
        code: 'custom',
        path: ['periodo'],
        message: 'Informe um período predefinido ou um intervalo, não os dois.',
      });
    }
    return;
  }

  if (!data_inicio || !data_fim) {
    contexto.addIssue({
      code: 'custom',
      path: [data_inicio ? 'data_fim' : 'data_inicio'],
      message: 'Informe um período predefinido ou as datas inicial e final.',
    });
    return;
  }

  if (data_fim < data_inicio) {
    contexto.addIssue({
      code: 'custom',
      path: ['data_fim'],
      message: 'A data final deve ser igual ou posterior à data inicial.',
    });
  }
}

export const listarFaturamentoQuerySchema = periodoFaturamentoQuerySchema
  .superRefine(validarPeriodoFaturamento)
  .meta({ id: 'ListarFaturamentoQuery' });

export const listarAtendimentosFaturamentoQuerySchema =
  periodoFaturamentoQuerySchema
    .extend({ cursor: z.string().optional() })
    .superRefine(validarPeriodoFaturamento)
    .meta({ id: 'ListarAtendimentosFaturamentoQuery' });

const clienteFaturamentoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
});

const procedimentoFaturamentoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
});

const metodoPagamentoFaturamentoSchema = z.enum([
  ...METODO_PAGAMENTO_MANUAL,
  ...METODO_PAGAMENTO_GATEWAY,
]);

export const pagamentoFaturamentoSchema = z
  .object({
    valor: valorSchema,
    origem: z.enum(ORIGEM_PAGAMENTO),
    metodo: metodoPagamentoFaturamentoSchema,
  })
  .meta({ id: 'PagamentoFaturamento' });

export const periodoFaturamentoSchema = z
  .object({
    data_inicio: dataSchema,
    data_fim: dataSchema,
  })
  .meta({ id: 'PeriodoFaturamento' });

export const resumoFaturamentoSchema = z
  .object({
    total_faturado: valorSchema,
    total_concluidos: z.number().int().nonnegative(),
    ticket_medio: valorSchema.nullable(),
    total_pendentes: z.number().int().nonnegative(),
  })
  .meta({ id: 'ResumoFaturamento' });

export const recebimentoPorMetodoSchema = z
  .object({
    origem: z.enum(ORIGEM_PAGAMENTO),
    metodo: metodoPagamentoFaturamentoSchema,
    valor: valorSchema,
  })
  .meta({ id: 'RecebimentoPorMetodo' });

export const sinalRetidoResponseSchema = z
  .object({
    agendamento_id: z.uuid(),
    ocorreu_em: z.iso.datetime(),
    cliente: clienteFaturamentoSchema,
    procedimento: procedimentoFaturamentoSchema,
    valor: valorSchema,
    motivo: z.enum(MOTIVO_SINAL_RETIDO),
  })
  .meta({ id: 'SinalRetidoResponse' });

export const faturamentoResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    periodo: periodoFaturamentoSchema,
    resumo: resumoFaturamentoSchema,
    recebimento_por_metodo: z.array(recebimentoPorMetodoSchema),
    sinais_retidos: z.array(sinalRetidoResponseSchema),
  })
  .meta({ id: 'FaturamentoResponse' });

export const atendimentoFaturamentoResponseSchema = z
  .object({
    agendamento_id: z.uuid(),
    ocorreu_em: z.iso.datetime(),
    cliente: clienteFaturamentoSchema,
    procedimento: procedimentoFaturamentoSchema,
    valor_total: valorSchema,
    sinal: pagamentoFaturamentoSchema.nullable(),
    restante: pagamentoFaturamentoSchema.nullable(),
    valor_pendente: valorSchema,
  })
  .meta({ id: 'AtendimentoFaturamentoResponse' });

export const listaAtendimentosFaturamentoResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    itens: z.array(atendimentoFaturamentoResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: 'ListaAtendimentosFaturamentoResponse' });
