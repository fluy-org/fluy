// Registro central do schema Drizzle.
// Cada tabela vive em src/{tabela}/ e é reexportada aqui.
// O objeto `schema` é passado ao cliente Drizzle no backend e ao drizzle-kit.
//
// Regra: este pacote só depende de drizzle-orm, drizzle-zod e zod.
// NADA de @nestjs/*, pg, postgres — se aparecer, vaza pro front.

import * as salaoSchema from './salao/index.js';
import * as usuarioSchema from './usuario/index.js';
import * as usuarioSalaoSchema from './usuario_salao/index.js';
import * as identidadeAutenticacaoSchema from './identidade_autenticacao/index.js';
import * as profissionalSchema from './profissional/index.js';
import * as configuracaoSalaoSchema from './configuracao_salao/index.js';
import * as janelaSemanalSchema from './janela_semanal/index.js';
import * as overrideDisponibilidadeSchema from './override_disponibilidade/index.js';
import * as janelaOverrideSchema from './janela_override/index.js';
import * as procedimentoSchema from './procedimento/index.js';
import * as clienteSchema from './cliente/index.js';
import * as sessaoClienteSchema from './sessao_cliente/index.js';
import * as agendamentoSchema from './agendamento/index.js';
import * as eventoAgendamentoSchema from './evento_agendamento/index.js';
import * as webhookGatewayEventoSchema from './webhook_gateway_evento/index.js';
import * as cobrancaGatewaySchema from './cobranca_gateway/index.js';
import * as cobrancaManualSchema from './cobranca_manual/index.js';
import * as pagamentoAgendamentoSchema from './pagamento_agendamento/index.js';
import * as reembolsoSchema from './reembolso/index.js';
import * as arquivoSchema from './arquivo/index.js';
import * as imagemProcedimentoSchema from './imagem_procedimento/index.js';
import * as anexoAgendamentoSchema from './anexo_agendamento/index.js';
import * as notaSchema from './nota/index.js';
import * as lembreteSchema from './lembrete/index.js';

export * from './salao/index.js';
export * from './usuario/index.js';
export * from './usuario_salao/index.js';
export * from './identidade_autenticacao/index.js';
export * from './profissional/index.js';
export * from './configuracao_salao/index.js';
export * from './janela_semanal/index.js';
export * from './override_disponibilidade/index.js';
export * from './janela_override/index.js';
export * from './procedimento/index.js';
export * from './cliente/index.js';
export * from './sessao_cliente/index.js';
export * from './agendamento/index.js';
export * from './evento_agendamento/index.js';
export * from './webhook_gateway_evento/index.js';
export * from './cobranca_gateway/index.js';
export * from './cobranca_manual/index.js';
export * from './pagamento_agendamento/index.js';
export * from './reembolso/index.js';
export * from './arquivo/index.js';
export * from './imagem_procedimento/index.js';
export * from './anexo_agendamento/index.js';
export * from './nota/index.js';
export * from './lembrete/index.js';
export * from './whatsapp/index.js';

export const schema = {
  ...salaoSchema,
  ...usuarioSchema,
  ...usuarioSalaoSchema,
  ...identidadeAutenticacaoSchema,
  ...profissionalSchema,
  ...configuracaoSalaoSchema,
  ...janelaSemanalSchema,
  ...overrideDisponibilidadeSchema,
  ...janelaOverrideSchema,
  ...procedimentoSchema,
  ...clienteSchema,
  ...sessaoClienteSchema,
  ...agendamentoSchema,
  ...eventoAgendamentoSchema,
  ...webhookGatewayEventoSchema,
  ...cobrancaGatewaySchema,
  ...cobrancaManualSchema,
  ...pagamentoAgendamentoSchema,
  ...reembolsoSchema,
  ...arquivoSchema,
  ...imagemProcedimentoSchema,
  ...anexoAgendamentoSchema,
  ...notaSchema,
  ...lembreteSchema,
} as const;

export type Schema = typeof schema;
