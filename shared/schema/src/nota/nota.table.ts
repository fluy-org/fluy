import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { cliente } from '@schema/cliente/cliente.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';

export const nota = pgTable('nota', {
  id: uuid('id').primaryKey().defaultRandom(),
  cliente_id: uuid('cliente_id')
    .notNull()
    .references(() => cliente.id, { onDelete: 'cascade' }),
  agendamento_id: uuid('agendamento_id').references(() => agendamento.id, {
    onDelete: 'cascade',
  }),
  texto: text('texto').notNull(),
  autor_id: uuid('autor_id')
    .notNull()
    .references(() => usuarioSalao.id, { onDelete: 'restrict' }),
  criada_em: timestamp('criada_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notaRelations = relations(nota, ({ one }) => ({
  cliente: one(cliente, {
    fields: [nota.cliente_id],
    references: [cliente.id],
  }),
  agendamento: one(agendamento, {
    fields: [nota.agendamento_id],
    references: [agendamento.id],
  }),
  autor: one(usuarioSalao, {
    fields: [nota.autor_id],
    references: [usuarioSalao.id],
  }),
}));
