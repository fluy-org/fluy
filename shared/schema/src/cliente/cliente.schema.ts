import { z } from "zod";
import { STATUS_FILTRO_CLIENTE } from "./cliente.enums.js";
import { whatsappInternacionalSchema } from "../whatsapp/whatsapp.schema.js";

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

export const listarClienteQuerySchema = z
  .object({
    status: z.enum(STATUS_FILTRO_CLIENTE).default('ativos'),
  })
  .meta({ id: "ListarClienteQuery" });
