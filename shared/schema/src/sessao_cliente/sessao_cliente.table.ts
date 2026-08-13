import { relations } from 'drizzle-orm';
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
