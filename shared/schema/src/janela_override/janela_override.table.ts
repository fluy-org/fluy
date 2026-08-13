import { relations } from 'drizzle-orm';
import { pgTable, uuid, time } from 'drizzle-orm/pg-core';
import { overrideDisponibilidade } from '@schema/override_disponibilidade/override_disponibilidade.table.js';

export const janelaOverride = pgTable('janela_override', {
  id: uuid('id').primaryKey().defaultRandom(),
  override_id: uuid('override_id')
    .notNull()
    .references(() => overrideDisponibilidade.id, { onDelete: 'cascade' }),
  hora_inicio: time('hora_inicio').notNull(),
  hora_fim: time('hora_fim').notNull(),
});

export const janelaOverrideRelations = relations(janelaOverride, ({ one }) => ({
  override: one(overrideDisponibilidade, {
    fields: [janelaOverride.override_id],
    references: [overrideDisponibilidade.id],
  }),
}));
