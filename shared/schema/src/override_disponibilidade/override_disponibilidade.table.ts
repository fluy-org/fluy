import { relations } from 'drizzle-orm';
import { pgTable, uuid, date, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { profissional } from '@schema/profissional/profissional.table.js';
import { janelaOverride } from '@schema/janela_override/janela_override.table.js';

export const overrideDisponibilidade = pgTable(
  'override_disponibilidade',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profissional_id: uuid('profissional_id')
      .notNull()
      .references(() => profissional.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    fechado: boolean('fechado').notNull(),
  },
  (t) => [
    uniqueIndex('override_disponibilidade_profissional_data_uq').on(t.profissional_id, t.data),
  ],
);

export const overrideDisponibilidadeRelations = relations(
  overrideDisponibilidade,
  ({ one, many }) => ({
    profissional: one(profissional, {
      fields: [overrideDisponibilidade.profissional_id],
      references: [profissional.id],
    }),
    janelas: many(janelaOverride),
  }),
);
