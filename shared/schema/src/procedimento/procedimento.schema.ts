import { z } from "zod";
import { imagemProcedimentoInputSchema } from "../imagem_procedimento/imagem_procedimento.schema.js";
import { TIPO_SINAL } from "./procedimento.enums.js";
import { PERIODO_MANUTENCAO_MAXIMO_DIAS } from "./procedimento.constants.js";

const MENSAGEM_NOME_INVALIDO = "Informe o nome do procedimento.";
const MENSAGEM_VALOR_INVALIDO = "Informe um valor com até duas casas decimais.";
const LIMITE_INTEIRO_POSTGRES = 2_147_483_647;

const textoObrigatorioSchema = z
  .string()
  .refine((valor) => valor.trim().length > 0, MENSAGEM_NOME_INVALIDO);

const valorMonetarioSchema = z
  .number()
  .nonnegative("Informe um valor maior ou igual a zero.")
  .refine(
    (valor) => valor === Number(valor.toFixed(2)),
    MENSAGEM_VALOR_INVALIDO,
  );

const camposCriarProcedimento = {
  nome: textoObrigatorioSchema.max(200, MENSAGEM_NOME_INVALIDO),
  descricao: z.string().optional(),
  info_pre_procedimento: z.string().optional(),
  duracao_min: z
    .number()
    .int("Informe a duração em minutos inteiros.")
    .positive("Informe uma duração maior que zero.")
    .max(
      LIMITE_INTEIRO_POSTGRES,
      "Informe uma duração dentro do limite aceito.",
    ),
  preco: valorMonetarioSchema,
  tipo_sinal: z.enum(TIPO_SINAL),
  valor_sinal: valorMonetarioSchema,
  imagem: imagemProcedimentoInputSchema.optional(),
  periodo_manutencao_dias: z
    .number()
    .int("Informe o período em dias inteiros.")
    .positive("Informe um período maior que zero.")
    .max(
      PERIODO_MANUTENCAO_MAXIMO_DIAS,
      `Informe um período de até ${PERIODO_MANUTENCAO_MAXIMO_DIAS} dias.`,
    )
    .optional(),
};

const dadosCriarProcedimentoSchema = z.object(camposCriarProcedimento);

export const criarProcedimentoSchema = dadosCriarProcedimentoSchema
  .superRefine(validarSinal)
  .meta({ id: "CriarProcedimento" });

export const atualizarProcedimentoSchema = z
  .object({
    ...camposCriarProcedimento,
    descricao: z.string().nullable().optional(),
    info_pre_procedimento: z.string().nullable().optional(),
    periodo_manutencao_dias: z
      .number()
      .int("Informe o período em dias inteiros.")
      .positive("Informe um período maior que zero.")
      .max(
        PERIODO_MANUTENCAO_MAXIMO_DIAS,
        `Informe um período de até ${PERIODO_MANUTENCAO_MAXIMO_DIAS} dias.`,
      )
      .nullable()
      .optional(),
    ativo: z.boolean().optional(),
  })
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe ao menos um campo para atualizar o procedimento.",
  })
  .meta({ id: "AtualizarProcedimento" });

export const procedimentoResponseSchema = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    descricao: z.string().nullable(),
    info_pre_procedimento: z.string().nullable(),
    duracao_min: z.number().int().positive(),
    preco: z.number().nonnegative(),
    tipo_sinal: z.enum(TIPO_SINAL),
    valor_sinal: z.number().nonnegative(),
    periodo_manutencao_dias: z.number().int().positive().nullable(),
    imagem_url: z.url().nullable(),
    ativo: z.boolean(),
    criado_em: z.iso.datetime(),
  })
  .meta({ id: "ProcedimentoResponse" });

export const procedimentoPublicoResponseSchema = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    descricao: z.string().nullable(),
    duracao_min: z.number().int().positive(),
    preco: z.number().nonnegative(),
    imagem_url: z.url().nullable(),
  })
  .meta({ id: "ProcedimentoPublicoResponse" });

function validarSinal(
  dados: z.infer<typeof dadosCriarProcedimentoSchema>,
  contexto: z.RefinementCtx,
) {
  if (dados.tipo_sinal === "percentual" && dados.valor_sinal > 100) {
    contexto.addIssue({
      code: "custom",
      path: ["valor_sinal"],
      message: "O sinal percentual deve ser de no máximo 100%.",
    });
  }

  if (
    dados.tipo_sinal === "fixo" &&
    dados.preco > 0 &&
    dados.valor_sinal > dados.preco
  ) {
    contexto.addIssue({
      code: "custom",
      path: ["valor_sinal"],
      message: "O sinal fixo não pode ser maior que o preço.",
    });
  }
}
