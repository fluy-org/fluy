import { relations } from 'drizzle-orm';
import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';
import { sessaoCliente } from '@schema/sessao_cliente/sessao_cliente.table.js';
import { agendamento } from '@schema/agendamento/agendamento.table.js';
import { nota } from '@schema/nota/nota.table.js';
import { lembrete } from '@schema/lembrete/lembrete.table.js';

export const cliente = pgTable(
	'cliente',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		salao_id: uuid('salao_id')
			.notNull()
			.references(() => salao.id, { onDelete: 'restrict' }),
		nome: varchar('nome', { length: 200 }).notNull(),
		whatsapp: varchar('whatsapp', { length: 30 }).notNull(),
		observacoes: text('observacoes'),
		criada_em: timestamp('criada_em', { withTimezone: true })
			.notNull()
			.defaultNow(),
		removido_em: timestamp('removido_em', { withTimezone: true }),
	},
	t => [uniqueIndex('cliente_salao_whatsapp_uq').on(t.salao_id, t.whatsapp)],
);

export const clienteRelations = relations(cliente, ({ one, many }) => ({
	salao: one(salao, {
		fields: [cliente.salao_id],
		references: [salao.id],
	}),
	sessoes: many(sessaoCliente),
	agendamentos: many(agendamento),
	notas: many(nota),
	lembretes: many(lembrete),
}));
