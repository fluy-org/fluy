import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';
import { pagamentoAgendamento } from '@schema/pagamento_agendamento/pagamento_agendamento.table.js';
import { reembolso } from '@schema/reembolso/reembolso.table.js';
import type { MetodoPagamentoManual } from './cobranca_manual.enums.js';

export const cobrancaManual = pgTable('cobranca_manual', {
  id: uuid('id').primaryKey().defaultRandom(),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: varchar('metodo', { length: 20 }).notNull().$type<MetodoPagamentoManual>(),
  registrada_por: uuid('registrada_por')
    .notNull()
    .references(() => usuarioSalao.id, { onDelete: 'restrict' }),
  registrada_em: timestamp('registrada_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cobrancaManualRelations = relations(cobrancaManual, ({ one, many }) => ({
  registrada_por_usuario: one(usuarioSalao, {
    fields: [cobrancaManual.registrada_por],
    references: [usuarioSalao.id],
  }),
  pagamentos: many(pagamentoAgendamento),
  reembolsos: many(reembolso),
}));
