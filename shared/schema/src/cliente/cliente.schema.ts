import { z } from "zod";
import { STATUS_FILTRO_CLIENTE } from "./cliente.enums.js";

export const whatsappClienteSchema = z
  .string()
  // A normalização mantém um único formato no banco e evita duplicidade por máscara.
  .transform((valor) => valor.replace(/\D/g, ""))
  .refine((valor) => valor.length === 10 || valor.length === 11, {
    message: "Informe um WhatsApp com DDD válido.",
  });

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
    whatsapp: z.string(),
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
