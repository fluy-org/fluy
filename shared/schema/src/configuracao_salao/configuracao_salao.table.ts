import { relations } from 'drizzle-orm';
import { pgTable, uuid, integer, text } from 'drizzle-orm/pg-core';
import { salao } from '@schema/salao/salao.table.js';

export const configuracaoSalao = pgTable('configuracao_salao', {
  id: uuid('id').primaryKey().defaultRandom(),
  salao_id: uuid('salao_id')
    .notNull()
    .unique()
    .references(() => salao.id, { onDelete: 'cascade' }),
  granularidade_min: integer('granularidade_min').notNull().default(30),
  prazo_reserva_min: integer('prazo_reserva_min').notNull().default(15),
  tolerancia_atraso_min: integer('tolerancia_atraso_min').notNull().default(15),
  antecedencia_min_horas: integer('antecedencia_min_horas').notNull().default(2),
  antecedencia_max_dias: integer('antecedencia_max_dias').notNull().default(60),
  mensagem_confirmacao: text('mensagem_confirmacao'),
  politica_atraso: text('politica_atraso'),
});

export const configuracaoSalaoRelations = relations(configuracaoSalao, ({ one }) => ({
  salao: one(salao, {
    fields: [configuracaoSalao.salao_id],
    references: [salao.id],
  }),
}));
