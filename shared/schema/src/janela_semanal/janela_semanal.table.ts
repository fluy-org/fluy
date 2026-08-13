import { relations } from 'drizzle-orm';
import { pgTable, uuid, smallint, time } from 'drizzle-orm/pg-core';
import { profissional } from '@schema/profissional/profissional.table.js';

export const janelaSemanal = pgTable('janela_semanal', {
  id: uuid('id').primaryKey().defaultRandom(),
  profissional_id: uuid('profissional_id')
    .notNull()
    .references(() => profissional.id, { onDelete: 'cascade' }),
  dia_semana: smallint('dia_semana').notNull(),
  hora_inicio: time('hora_inicio').notNull(),
  hora_fim: time('hora_fim').notNull(),
});

export const janelaSemanalRelations = relations(janelaSemanal, ({ one }) => ({
  profissional: one(profissional, {
    fields: [janelaSemanal.profissional_id],
    references: [profissional.id],
  }),
}));
