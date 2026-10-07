import { relations } from 'drizzle-orm';
import { index, pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import type {
  AutorCancelamento,
  TipoEventoAgendamento,
} from './evento_agendamento.enums.js';

export const eventoAgendamento = pgTable(
  'evento_agendamento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agendamento_id: uuid('agendamento_id')
      .notNull()
      .references(() => agendamento.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 20 }).notNull().$type<TipoEventoAgendamento>(),
    ocorreu_em: timestamp('ocorreu_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Registro interno do salão. Nunca exibido para a cliente.
    motivo: text('motivo'),
    // Preenchido só em `tipo = cancelado`; o faturamento distingue o sinal
    // retido por cancelamento da cliente do retido por cancelamento do salão.
    cancelado_por: varchar('cancelado_por', { length: 20 }).$type<AutorCancelamento>(),
  },
  (t) => [
    index('evento_agendamento_tipo_ocorreu_em_idx').on(t.tipo, t.ocorreu_em),
  ],
);

export const eventoAgendamentoRelations = relations(eventoAgendamento, ({ one }) => ({
  agendamento: one(agendamento, {
    fields: [eventoAgendamento.agendamento_id],
    references: [agendamento.id],
  }),
}));
