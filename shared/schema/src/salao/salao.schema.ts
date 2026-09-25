import { z } from "zod";
import {
  LIMITE_MINIMO_SUBDOMINIO,
  LIMITE_SUBDOMINIO,
} from "./salao.constants.js";
import { FUSOS_HORARIOS_BRASIL } from "./salao.enums.js";
import { whatsappInternacionalSchema } from "../whatsapp/whatsapp.schema.js";

const MENSAGEM_SUBDOMINIO_INVALIDO = `Use de ${LIMITE_MINIMO_SUBDOMINIO} a ${LIMITE_SUBDOMINIO} caracteres minúsculos, números ou hífens.`;

const subdominioSchema = z
  .string()
  .min(LIMITE_MINIMO_SUBDOMINIO, MENSAGEM_SUBDOMINIO_INVALIDO)
  .max(LIMITE_SUBDOMINIO, MENSAGEM_SUBDOMINIO_INVALIDO)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, MENSAGEM_SUBDOMINIO_INVALIDO);

const contatoWhatsappSchema = whatsappInternacionalSchema;

function textoObrigatorioSchema(mensagem: string) {
  return z.string().refine((valor) => valor.trim().length > 0, mensagem);
}

export const criarSalaoSchema = z
  .object({
    nome: textoObrigatorioSchema("Revise o nome do salão.").max(
      200,
      "Revise o nome do salão.",
    ),
    subdominio: subdominioSchema,
    contato_whatsapp: contatoWhatsappSchema,
    endereco: textoObrigatorioSchema("Informe o endereço do salão."),
    fuso_horario: z.enum(FUSOS_HORARIOS_BRASIL, {
      error: "Selecione o fuso horário do salão.",
    }),
  })
  .meta({ id: "CriarSalao" });

export const salaoResponseSchema = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    subdominio: subdominioSchema,
    contato_whatsapp: contatoWhatsappSchema,
    endereco: z.string(),
    fuso_horario: z.enum(FUSOS_HORARIOS_BRASIL),
    criado_em: z.iso.datetime(),
  })
  .meta({ id: "SalaoResponse" });

export const salaoPublicoResponseSchema = salaoResponseSchema
  .pick({
    nome: true,
    subdominio: true,
    contato_whatsapp: true,
    endereco: true,
  })
  .meta({ id: "SalaoPublicoResponse" });

export const subdominioIndisponivelSchema = z
  .object({
    codigo: z.literal("subdominio_indisponivel"),
    sugestoes: z.array(subdominioSchema).length(3),
  })
  .meta({ id: "SubdominioIndisponivel" });
