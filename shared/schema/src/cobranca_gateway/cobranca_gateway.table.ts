import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { pagamentoAgendamento } from '@schema/pagamento_agendamento/pagamento_agendamento.table.js';
import { reembolso } from '@schema/reembolso/reembolso.table.js';
import type {
  MetodoPagamentoGateway,
  StatusCobrancaGateway,
} from './cobranca_gateway.enums.js';

export const cobrancaGateway = pgTable('cobranca_gateway', {
  id: uuid('id').primaryKey().defaultRandom(),
  id_externo: varchar('id_externo', { length: 200 }).notNull().unique(),
  idempotency_key: varchar('idempotency_key', { length: 200 }).notNull().unique(),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: varchar('metodo', { length: 20 }).notNull().$type<MetodoPagamentoGateway>(),
  status: varchar('status', { length: 20 }).notNull().$type<StatusCobrancaGateway>(),
  criada_em: timestamp('criada_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
  confirmada_em: timestamp('confirmada_em', { withTimezone: true }),
  atualizado_em: timestamp('atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cobrancaGatewayRelations = relations(cobrancaGateway, ({ many }) => ({
  pagamentos: many(pagamentoAgendamento),
  reembolsos: many(reembolso),
}));
