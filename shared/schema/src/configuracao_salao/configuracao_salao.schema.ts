import { z } from 'zod';

const numeroPositivoSchema = z
  .number()
  .int('Informe um valor inteiro.')
  .positive('Informe um valor maior que zero.');

const textoOpcionalSchema = z
  .string()
  .refine((valor) => valor.trim().length > 0, 'Informe um texto válido.');

const camposAtualizarConfiguracaoSalao = {
  granularidade_min: numeroPositivoSchema,
  prazo_reserva_min: numeroPositivoSchema,
  tolerancia_atraso_min: numeroPositivoSchema,
  antecedencia_min_horas: numeroPositivoSchema,
  antecedencia_max_dias: numeroPositivoSchema,
  mensagem_confirmacao: textoOpcionalSchema.nullable(),
  politica_atraso: textoOpcionalSchema.nullable(),
};

export const atualizarConfiguracaoSalaoSchema = z
  .object(camposAtualizarConfiguracaoSalao)
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar a configuração.',
  })
  .meta({ id: 'AtualizarConfiguracaoSalao' });

export const configuracaoSalaoResponseSchema = z
  .object({
    granularidade_min: numeroPositivoSchema,
    prazo_reserva_min: numeroPositivoSchema,
    tolerancia_atraso_min: numeroPositivoSchema,
    antecedencia_min_horas: numeroPositivoSchema,
    antecedencia_max_dias: numeroPositivoSchema,
    mensagem_confirmacao: z.string().nullable(),
    politica_atraso: z.string().nullable(),
  })
  .meta({ id: 'ConfiguracaoSalaoResponse' });
