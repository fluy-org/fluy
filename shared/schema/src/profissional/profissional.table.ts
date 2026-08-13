import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';
import { janelaSemanal } from '@schema/janela_semanal/janela_semanal.table.js';
import { overrideDisponibilidade } from '@schema/override_disponibilidade/override_disponibilidade.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';

export const profissional = pgTable('profissional', {
  id: uuid('id').primaryKey().defaultRandom(),
  salao_id: uuid('salao_id')
    .notNull()
    .references(() => salao.id, { onDelete: 'restrict' }),
  nome: varchar('nome', { length: 200 }).notNull(),
  ativo: boolean('ativo').notNull().default(true),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profissionalRelations = relations(profissional, ({ one, many }) => ({
  salao: one(salao, {
    fields: [profissional.salao_id],
    references: [salao.id],
  }),
  janelas_semanais: many(janelaSemanal),
  overrides: many(overrideDisponibilidade),
  agendamentos: many(agendamento),
}));
