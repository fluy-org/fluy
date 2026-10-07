import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import { cliente } from '@schema/cliente/cliente.table.js';
import { lembrete } from '@schema/lembrete/lembrete.table.js';
import { salao } from '@schema/salao/salao.table.js';
import { usuarioSalao } from '@schema/usuario_salao/usuario_salao.table.js';
import type { TipoAviso } from './aviso.enums.js';

export const aviso = pgTable(
  'aviso',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    salao_id: uuid('salao_id')
      .notNull()
      .references(() => salao.id, { onDelete: 'restrict' }),
    cliente_id: uuid('cliente_id').references(() => cliente.id, {
      onDelete: 'cascade',
    }),
    usuario_salao_id: uuid('usuario_salao_id').references(
      () => usuarioSalao.id,
      { onDelete: 'cascade' },
    ),
    agendamento_id: uuid('agendamento_id').references(() => agendamento.id, {
      onDelete: 'cascade',
    }),
    lembrete_id: uuid('lembrete_id').references(() => lembrete.id, {
      onDelete: 'cascade',
    }),
    tipo: varchar('tipo', { length: 40 })
      .notNull()
      .default('generico')
      .$type<TipoAviso>(),
    titulo: varchar('titulo', { length: 160 }).notNull(),
    mensagem: text('mensagem').notNull(),
    criado_em: timestamp('criado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
    reconhecido_em: timestamp('reconhecido_em', { withTimezone: true }),
  },
  (t) => [
    check(
      'aviso_destinatario_ck',
      sql`(${t.cliente_id} is not null)::int + (${t.usuario_salao_id} is not null)::int = 1`,
    ),
    index('aviso_cliente_pendente_idx')
      .on(t.salao_id, t.cliente_id, t.criado_em, t.id)
      .where(sql`${t.cliente_id} is not null and ${t.reconhecido_em} is null`),
    index('aviso_usuario_salao_pendente_idx')
      .on(t.salao_id, t.usuario_salao_id, t.criado_em, t.id)
      .where(
        sql`${t.usuario_salao_id} is not null and ${t.reconhecido_em} is null`,
      ),
    uniqueIndex('aviso_usuario_salao_lembrete_uq')
      .on(t.usuario_salao_id, t.lembrete_id)
      .where(
        sql`${t.usuario_salao_id} is not null and ${t.lembrete_id} is not null`,
      ),
  ],
);

export const avisoRelations = relations(aviso, ({ one }) => ({
  salao: one(salao, {
    fields: [aviso.salao_id],
    references: [salao.id],
  }),
  cliente: one(cliente, {
    fields: [aviso.cliente_id],
    references: [cliente.id],
  }),
  usuarioSalao: one(usuarioSalao, {
    fields: [aviso.usuario_salao_id],
    references: [usuarioSalao.id],
  }),
  agendamento: one(agendamento, {
    fields: [aviso.agendamento_id],
    references: [agendamento.id],
  }),
  lembrete: one(lembrete, {
    fields: [aviso.lembrete_id],
    references: [lembrete.id],
  }),
}));
