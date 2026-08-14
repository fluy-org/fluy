import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { identidadeAutenticacao } from '@schema/identidade_autenticacao/identidade_autenticacao.table.js';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';

export const usuario = pgTable('usuario', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 100 }).notNull(),
  sobrenome: varchar('sobrenome', { length: 200 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usuarioRelations = relations(usuario, ({ many }) => ({
  identidades_autenticacao: many(identidadeAutenticacao),
  vinculos_salao: many(usuarioSalao),
}));
