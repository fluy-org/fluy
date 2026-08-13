import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';
import { metodoAutenticacaoUsuario } from '@schema/metodo_autenticacao_usuario/metodo_autenticacao_usuario.table.js';
import type { PapelUsuarioSalao } from './usuario_salao.enums.js';

export const usuarioSalao = pgTable('usuario_salao', {
  id: uuid('id').primaryKey().defaultRandom(),
  salao_id: uuid('salao_id')
    .notNull()
    .references(() => salao.id, { onDelete: 'restrict' }),
  nome: varchar('nome', { length: 200 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  papel: varchar('papel', { length: 20 })
    .notNull()
    .$type<PapelUsuarioSalao>(),
  criado_em: timestamp('criado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usuarioSalaoRelations = relations(usuarioSalao, ({ one, many }) => ({
  salao: one(salao, {
    fields: [usuarioSalao.salao_id],
    references: [salao.id],
  }),
  metodos_autenticacao: many(metodoAutenticacaoUsuario),
}));

