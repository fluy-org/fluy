import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, numeric, text, timestamp, check } from 'drizzle-orm/pg-core';
import { cobrancaGateway } from '@schema/cobranca_gateway/cobranca_gateway.table.js';
import { cobrancaManual } from '@schema/cobranca_manual/cobranca_manual.table.js';

export const reembolso = pgTable(
  'reembolso',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cobranca_gateway_id: uuid('cobranca_gateway_id').references(() => cobrancaGateway.id, {
      onDelete: 'restrict',
    }),
    cobranca_manual_id: uuid('cobranca_manual_id').references(() => cobrancaManual.id, {
      onDelete: 'restrict',
    }),
    valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
    motivo: text('motivo'),
    id_externo_gateway: varchar('id_externo_gateway', { length: 200 }),
    criado_em: timestamp('criado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmado_em: timestamp('confirmado_em', { withTimezone: true }),
  },
  (t) => [
    check(
      'reembolso_cobranca_xor',
      sql`(${t.cobranca_gateway_id} IS NOT NULL)::int + (${t.cobranca_manual_id} IS NOT NULL)::int = 1`,
    ),
  ],
);

export const reembolsoRelations = relations(reembolso, ({ one }) => ({
  cobranca_gateway: one(cobrancaGateway, {
    fields: [reembolso.cobranca_gateway_id],
    references: [cobrancaGateway.id],
  }),
  cobranca_manual: one(cobrancaManual, {
    fields: [reembolso.cobranca_manual_id],
    references: [cobrancaManual.id],
  }),
}));
