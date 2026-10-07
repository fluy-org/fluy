import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
import { cliente } from '@schema/cliente/cliente.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import { procedimento } from '@schema/procedimento/procedimento.table.js';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';
import type { OrigemLembrete, StatusLembrete } from './lembrete.enums.js';

export const lembrete = pgTable('lembrete', {
  id: uuid('id').primaryKey().defaultRandom(),
  cliente_id: uuid('cliente_id')
    .notNull()
    .references(() => cliente.id, { onDelete: 'cascade' }),
  agendamento_id: uuid('agendamento_id').references(() => agendamento.id, {
    onDelete: 'cascade',
  }),
  procedimento_id: uuid('procedimento_id').references(() => procedimento.id, {
    onDelete: 'set null',
  }),
  texto: text('texto').notNull(),
  data_alvo: date('data_alvo').notNull(),
  origem: varchar('origem', { length: 20 }).notNull().$type<OrigemLembrete>(),
  status: varchar('status', { length: 20 }).notNull().$type<StatusLembrete>(),
  autor_id: uuid('autor_id').references(() => usuarioSalao.id, {
    onDelete: 'restrict',
  }),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
  concluido_em: timestamp('concluido_em', { withTimezone: true }),
  notificado_em: timestamp('notificado_em', { withTimezone: true }),
});

export const lembreteRelations = relations(lembrete, ({ one }) => ({
  cliente: one(cliente, {
    fields: [lembrete.cliente_id],
    references: [cliente.id],
  }),
  agendamento: one(agendamento, {
    fields: [lembrete.agendamento_id],
    references: [agendamento.id],
  }),
  procedimento: one(procedimento, {
    fields: [lembrete.procedimento_id],
    references: [procedimento.id],
  }),
  autor: one(usuarioSalao, {
    fields: [lembrete.autor_id],
    references: [usuarioSalao.id],
  }),
}));
