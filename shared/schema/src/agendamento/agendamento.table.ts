import { relations } from 'drizzle-orm';
import { pgTable, uuid, integer, numeric, varchar, timestamp } from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';
import { profissional } from '@schema/profissional/profissional.table.js';
import { cliente } from '@schema/cliente/cliente.table.js';
import { procedimento } from '@schema/procedimento/procedimento.table.js';
import { eventoAgendamento } from '@schema/evento_agendamento/evento_agendamento.table.js';
import { pagamentoAgendamento } from '@schema/pagamento_agendamento/pagamento_agendamento.table.js';
import { anexoAgendamento } from '@schema/anexo_agendamento/anexo_agendamento.table.js';
import { nota } from '@schema/nota/nota.table.js';
import { lembrete } from '@schema/lembrete/lembrete.table.js';
import type { EstadoAgendamento } from './agendamento.enums.js';

export const agendamento = pgTable('agendamento', {
  id: uuid('id').primaryKey().defaultRandom(),
  salao_id: uuid('salao_id')
    .notNull()
    .references(() => salao.id, { onDelete: 'restrict' }),
  profissional_id: uuid('profissional_id')
    .notNull()
    .references(() => profissional.id, { onDelete: 'restrict' }),
  cliente_id: uuid('cliente_id')
    .notNull()
    .references(() => cliente.id, { onDelete: 'restrict' }),
  procedimento_id: uuid('procedimento_id')
    .notNull()
    .references(() => procedimento.id, { onDelete: 'restrict' }),
  inicio_em: timestamp('inicio_em', { withTimezone: true }).notNull(),
  duracao_min: integer('duracao_min').notNull(),
  preco_total: numeric('preco_total', { precision: 10, scale: 2 }).notNull(),
  valor_sinal: numeric('valor_sinal', { precision: 10, scale: 2 }).notNull(),
  estado: varchar('estado', { length: 20 }).notNull().$type<EstadoAgendamento>(),
  expira_em: timestamp('expira_em', { withTimezone: true }),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const agendamentoRelations = relations(agendamento, ({ one, many }) => ({
  salao: one(salao, {
    fields: [agendamento.salao_id],
    references: [salao.id],
  }),
  profissional: one(profissional, {
    fields: [agendamento.profissional_id],
    references: [profissional.id],
  }),
  cliente: one(cliente, {
    fields: [agendamento.cliente_id],
    references: [cliente.id],
  }),
  procedimento: one(procedimento, {
    fields: [agendamento.procedimento_id],
    references: [procedimento.id],
  }),
  eventos: many(eventoAgendamento),
  pagamentos: many(pagamentoAgendamento),
  anexos: many(anexoAgendamento),
  notas: many(nota),
  lembretes: many(lembrete),
}));
