import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { cliente } from '@schema/cliente/cliente.table.js';
import type { TipoSessaoCliente } from './sessao_cliente.enums.js';

export const sessaoCliente = pgTable(
  'sessao_cliente',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cliente_id: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 30 }).notNull().$type<TipoSessaoCliente>(),
    credencial: varchar('credencial', { length: 500 }).notNull(),
    nome_informado: varchar('nome_informado', { length: 200 }),
    verificada_em: timestamp('verificada_em', { withTimezone: true }),
    expira_em: timestamp('expira_em', { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '90 days'`),
    revogada_em: timestamp('revogada_em', { withTimezone: true }),
    criada_em: timestamp('criada_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ultimo_uso_em: timestamp('ultimo_uso_em', { withTimezone: true }),
  },
  (t) => [uniqueIndex('sessao_cliente_tipo_credencial_uq').on(t.tipo, t.credencial)],
);

export const sessaoClienteRelations = relations(sessaoCliente, ({ one }) => ({
  cliente: one(cliente, {
    fields: [sessaoCliente.cliente_id],
    references: [cliente.id],
  }),
}));
