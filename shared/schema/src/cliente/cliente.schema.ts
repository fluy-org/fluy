import { z } from "zod";
import { ESTADO_AGENDAMENTO } from "../agendamento/agendamento.enums.js";
import { FUSOS_HORARIOS_BRASIL } from "../salao/salao.enums.js";
import { whatsappInternacionalSchema } from "../whatsapp/whatsapp.schema.js";
import {
  ORDENACAO_CLIENTE,
  SEGMENTO_CLIENTE,
  STATUS_FILTRO_CLIENTE,
} from "./cliente.enums.js";

// O WhatsApp identifica a cliente dentro do salão; a normalização evita que
// máscara, DDI omitido ou outro dispositivo criem cadastros duplicados.
export const whatsappClienteSchema = whatsappInternacionalSchema;

const nomeClienteSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome do cliente.")
  .max(200, "O nome do cliente deve ter no máximo 200 caracteres.");

export const criarClienteSchema = z
  .object({
    nome: nomeClienteSchema,
    whatsapp: whatsappClienteSchema,
    observacoes: z.string().optional(),
  })
  .meta({ id: "CriarCliente" });

export const atualizarClienteSchema = z
  .object({
    nome: nomeClienteSchema.optional(),
    whatsapp: whatsappClienteSchema.optional(),
    observacoes: z.string().nullable().optional(),
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe ao menos um campo para atualizar o cliente.",
  })
  .meta({ id: "AtualizarCliente" });

export const clienteResponseSchema = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    whatsapp: whatsappInternacionalSchema,
    observacoes: z.string().nullable(),
    ativo: z.boolean(),
    criada_em: z.iso.datetime(),
  })
  .meta({ id: "ClienteResponse" });

const cursorSchema = z.string().optional();

const fusoHorarioSchema = z.enum(FUSOS_HORARIOS_BRASIL);

export const listarClienteQuerySchema = z
  .object({
    status: z.enum(STATUS_FILTRO_CLIENTE).default('ativos'),
    segmento: z.enum(SEGMENTO_CLIENTE).default('todas'),
    ordenacao: z.enum(ORDENACAO_CLIENTE).default('nome'),
    busca: z.string().trim().optional(),
    cursor: cursorSchema,
  })
  .meta({ id: "ListarClienteQuery" });

export const clienteListaItemResponseSchema = clienteResponseSchema
  .extend({
    ultimo_atendimento_em: z.iso.datetime().nullable(),
  })
  .meta({ id: "ClienteListaItemResponse" });

export const listaClientesResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    itens: z.array(clienteListaItemResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: "ListaClientesResponse" });

export const metricasClienteSchema = z
  .object({
    total_gasto: z.number().nonnegative(),
    total_agendamentos: z.number().int().nonnegative(),
    cancelamentos: z.number().int().nonnegative(),
    faltas: z.number().int().nonnegative(),
    ultimo_atendimento_em: z.iso.datetime().nullable(),
  })
  .meta({ id: "MetricasCliente" });

export const clienteFichaResponseSchema = clienteResponseSchema
  .extend({
    fuso_horario: fusoHorarioSchema,
    metricas: metricasClienteSchema,
  })
  .meta({ id: "ClienteFichaResponse" });

export const listarAgendamentosClienteQuerySchema = z
  .object({
    cursor: cursorSchema,
  })
  .meta({ id: "ListarAgendamentosClienteQuery" });

export const agendamentoClienteResponseSchema = z
  .object({
    id: z.uuid(),
    inicio_em: z.iso.datetime(),
    duracao_min: z.number().int().positive(),
    estado: z.enum(ESTADO_AGENDAMENTO),
    procedimento: z.object({
      id: z.uuid(),
      nome: z.string(),
    }),
    preco_total: z.number().nonnegative(),
    valor_sinal: z.number().nonnegative(),
  })
  .meta({ id: "AgendamentoClienteResponse" });

export const listaAgendamentosClienteResponseSchema = z
  .object({
    fuso_horario: fusoHorarioSchema,
    itens: z.array(agendamentoClienteResponseSchema),
    proximo_cursor: z.string().nullable(),
  })
  .meta({ id: "ListaAgendamentosClienteResponse" });
