import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';
import type { TipoAutenticacaoUsuario } from './metodo_autenticacao_usuario.enums.js';

export const metodoAutenticacaoUsuario = pgTable(
  'metodo_autenticacao_usuario',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuario_salao_id: uuid('usuario_salao_id')
      .notNull()
      .references(() => usuarioSalao.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 30 })
      .notNull()
      .$type<TipoAutenticacaoUsuario>(),
    credencial: varchar('credencial', { length: 500 }).notNull(),
    criado_em: timestamp('criado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ultimo_uso_em: timestamp('ultimo_uso_em', { withTimezone: true }),
  },
  (t) => [uniqueIndex('metodo_autenticacao_usuario_tipo_credencial_uq').on(t.tipo, t.credencial)],
);

export const metodoAutenticacaoUsuarioRelations = relations(
  metodoAutenticacaoUsuario,
  ({ one }) => ({
    usuario_salao: one(usuarioSalao, {
      fields: [metodoAutenticacaoUsuario.usuario_salao_id],
      references: [usuarioSalao.id],
    }),
  }),
);
