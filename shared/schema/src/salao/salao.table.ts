import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';
import { profissional } from '@schema/profissional/profissional.table.js';
import { configuracaoSalao } from '@schema/configuracao_salao/configuracao_salao.table.js';
import { procedimento } from '@schema/procedimento/procedimento.table.js';
import { cliente } from '@schema/cliente/cliente.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';

export const salao = pgTable('salao', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 200 }).notNull(),
  subdominio: varchar('subdominio', { length: 100 }).notNull().unique(),
  contato_whatsapp: varchar('contato_whatsapp', { length: 30 }).notNull(),
  endereco: text('endereco').notNull(),
  fuso_horario: varchar('fuso_horario', { length: 60 }).notNull(),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const salaoRelations = relations(salao, ({ many, one }) => ({
  usuarios: many(usuarioSalao),
  profissionais: many(profissional),
  configuracao: one(configuracaoSalao),
  procedimentos: many(procedimento),
  clientes: many(cliente),
  agendamentos: many(agendamento),
}));
