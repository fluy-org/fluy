import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';
import { usuario } from '@schema/usuario/usuario.table.js';
import type { PapelUsuarioSalao } from './usuario_salao.enums.js';

export const usuarioSalao = pgTable(
  'usuario_salao',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuario_id: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'restrict' }),
    salao_id: uuid('salao_id')
      .notNull()
      .references(() => salao.id, { onDelete: 'restrict' }),
    papel: varchar('papel', { length: 20 })
      .notNull()
      .$type<PapelUsuarioSalao>(),
    criado_em: timestamp('criado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('usuario_salao_usuario_salao_uq').on(t.usuario_id, t.salao_id),
    uniqueIndex('usuario_salao_dono_usuario_uq')
      .on(t.usuario_id)
      .where(sql`${t.papel} = 'dono'`),
  ],
);

export const usuarioSalaoRelations = relations(usuarioSalao, ({ one }) => ({
  usuario: one(usuario, {
    fields: [usuarioSalao.usuario_id],
    references: [usuario.id],
  }),
  salao: one(salao, {
    fields: [usuarioSalao.salao_id],
    references: [salao.id],
  }),
}));
