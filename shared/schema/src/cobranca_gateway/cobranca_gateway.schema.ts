import { z } from 'zod';
import { agendamentoResponseSchema } from '../agendamento/agendamento.schema.js';
import { MODALIDADE_PAGAMENTO_GATEWAY, RESULTADO_SIMULACAO_PAGAMENTO, SITUACAO_PAGAMENTO_PIX, STATUS_COBRANCA_GATEWAY } from './cobranca_gateway.enums.js';

export const reservaPixResponseSchema = agendamentoResponseSchema
  .extend({ expira_em: z.iso.datetime() })
  .meta({ id: 'ReservaPixResponse' });

export const iniciarPagamentoPixSchema = z
  .object({
    credencial: z.uuid('Informe uma credencial de dispositivo válida.'),
    modalidade: z.enum(MODALIDADE_PAGAMENTO_GATEWAY),
  })
  .strict()
  .meta({ id: 'IniciarPagamentoPix' });

export const consultarPagamentoPixQuerySchema = z
  .object({
    credencial: z.uuid('Informe uma credencial de dispositivo válida.'),
  })
  .strict()
  .meta({ id: 'ConsultarPagamentoPixQuery' });

export const simularPagamentoPixSchema = z
  .object({
    resultado: z.enum(RESULTADO_SIMULACAO_PAGAMENTO),
  })
  .strict()
  .meta({ id: 'SimularPagamentoPix' });

export const simularPagamentoPixResponseSchema = z
  .object({ processado: z.literal(true) })
  .meta({ id: 'SimularPagamentoPixResponse' });

export const pagamentoPixResponseSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(STATUS_COBRANCA_GATEWAY),
    modalidade: z.enum(MODALIDADE_PAGAMENTO_GATEWAY),
    valor_salao: z.number().nonnegative(),
    taxa_cliente: z.number().nonnegative(),
    total_cliente: z.number().nonnegative(),
    expira_em: z.iso.datetime(),
    situacao: z.enum(SITUACAO_PAGAMENTO_PIX),
    instrucao_cliente: z.object({ tipo: z.literal('url'), valor: z.url() }).nullable(),
  })
  .meta({ id: 'PagamentoPixResponse' });
