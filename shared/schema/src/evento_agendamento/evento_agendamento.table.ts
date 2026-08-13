import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import type { TipoEventoAgendamento } from './evento_agendamento.enums.js';

export const eventoAgendamento = pgTable('evento_agendamento', {
  id: uuid('id').primaryKey().defaultRandom(),
  agendamento_id: uuid('agendamento_id')
    .notNull()
    .references(() => agendamento.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 20 }).notNull().$type<TipoEventoAgendamento>(),
  ocorreu_em: timestamp('ocorreu_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventoAgendamentoRelations = relations(eventoAgendamento, ({ one }) => ({
  agendamento: one(agendamento, {
    fields: [eventoAgendamento.agendamento_id],
    references: [agendamento.id],
  }),
}));
