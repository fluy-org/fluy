import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, numeric, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { pagamentoAgendamento } from '@schema/pagamento_agendamento/pagamento_agendamento.table.js';
import { reembolso } from '@schema/reembolso/reembolso.table.js';
import { salao } from '@schema/salao/salao.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import type {
  MetodoPagamentoGateway,
  ModalidadePagamentoGateway,
  StatusCobrancaGateway,
} from './cobranca_gateway.enums.js';

export const cobrancaGateway = pgTable('cobranca_gateway', {
  id: uuid('id').primaryKey().defaultRandom(),
  salao_id: uuid('salao_id').references(() => salao.id, { onDelete: 'restrict' }),
  agendamento_id: uuid('agendamento_id').references(() => agendamento.id, { onDelete: 'restrict' }),
  modalidade: varchar('modalidade', { length: 20 }).$type<ModalidadePagamentoGateway>(),
  id_externo: varchar('id_externo', { length: 200 }).unique(),
  idempotency_key: varchar('idempotency_key', { length: 200 }).notNull().unique(),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  taxa_cliente: numeric('taxa_cliente', { precision: 10, scale: 2 }),
  total_cliente: numeric('total_cliente', { precision: 10, scale: 2 }),
  pix_tipo_chave: varchar('pix_tipo_chave', { length: 20 }),
  pix_chave: varchar('pix_chave', { length: 200 }),
  pix_nome_recebedor: varchar('pix_nome_recebedor', { length: 200 }),
  instrucao_cliente: jsonb('instrucao_cliente').$type<{ tipo: 'url'; valor: string } | null>(),
  metodo: varchar('metodo', { length: 20 }).notNull().$type<MetodoPagamentoGateway>(),
  status: varchar('status', { length: 20 }).notNull().$type<StatusCobrancaGateway>(),
  divergencia: boolean('divergencia').notNull().default(false),
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
