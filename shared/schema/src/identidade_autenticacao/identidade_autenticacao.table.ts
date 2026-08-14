import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuario } from '@schema/usuario/usuario.table.js';
import type { ProvedorAutenticacao } from './identidade_autenticacao.enums.js';

export const identidadeAutenticacao = pgTable(
  'identidade_autenticacao',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuario_id: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    provedor: varchar('provedor', { length: 30 })
      .notNull()
      .$type<ProvedorAutenticacao>(),
    identificador_externo: varchar('identificador_externo', {
      length: 500,
    }).notNull(),
    criado_em: timestamp('criado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('identidade_autenticacao_provedor_identificador_externo_uq').on(
      t.provedor,
      t.identificador_externo,
    ),
  ],
);

export const identidadeAutenticacaoRelations = relations(
  identidadeAutenticacao,
  ({ one }) => ({
    usuario: one(usuario, {
      fields: [identidadeAutenticacao.usuario_id],
      references: [usuario.id],
    }),
  }),
);
