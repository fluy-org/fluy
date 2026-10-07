import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, check } from 'drizzle-orm/pg-core';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import { cobrancaGateway } from '@schema/cobranca_gateway/cobranca_gateway.table.js';
import { cobrancaManual } from '@schema/cobranca_manual/cobranca_manual.table.js';
import type { TipoPagamentoAgendamento } from './pagamento_agendamento.enums.js';

export const pagamentoAgendamento = pgTable(
  'pagamento_agendamento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agendamento_id: uuid('agendamento_id')
      .notNull()
      .references(() => agendamento.id, { onDelete: 'cascade' }),
    cobranca_gateway_id: uuid('cobranca_gateway_id').references(() => cobrancaGateway.id, {
      onDelete: 'restrict',
    }),
    cobranca_manual_id: uuid('cobranca_manual_id').references(() => cobrancaManual.id, {
      onDelete: 'restrict',
    }),
    tipo: varchar('tipo', { length: 20 }).notNull().$type<TipoPagamentoAgendamento>(),
  },
  (t) => [
    check(
      'pagamento_agendamento_cobranca_xor',
      sql`(${t.cobranca_gateway_id} IS NOT NULL)::int + (${t.cobranca_manual_id} IS NOT NULL)::int = 1`,
    ),
  ],
);

export const pagamentoAgendamentoRelations = relations(pagamentoAgendamento, ({ one }) => ({
  agendamento: one(agendamento, {
    fields: [pagamentoAgendamento.agendamento_id],
    references: [agendamento.id],
  }),
  cobranca_gateway: one(cobrancaGateway, {
    fields: [pagamentoAgendamento.cobranca_gateway_id],
    references: [cobrancaGateway.id],
  }),
  cobranca_manual: one(cobrancaManual, {
    fields: [pagamentoAgendamento.cobranca_manual_id],
    references: [cobrancaManual.id],
  }),
}));
