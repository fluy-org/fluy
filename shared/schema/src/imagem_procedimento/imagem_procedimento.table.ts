import { relations } from 'drizzle-orm';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { procedimento } from '@schema/procedimento/procedimento.table.js';
import { arquivo } from '@schema/arquivo/arquivo.table.js';

export const imagemProcedimento = pgTable('imagem_procedimento', {
  procedimento_id: uuid('procedimento_id')
    .primaryKey()
    .references(() => procedimento.id, { onDelete: 'cascade' }),
  arquivo_id: uuid('arquivo_id')
    .notNull()
    .unique()
    .references(() => arquivo.id, { onDelete: 'restrict' }),
});

export const imagemProcedimentoRelations = relations(imagemProcedimento, ({ one }) => ({
  procedimento: one(procedimento, {
    fields: [imagemProcedimento.procedimento_id],
    references: [procedimento.id],
  }),
  arquivo: one(arquivo, {
    fields: [imagemProcedimento.arquivo_id],
    references: [arquivo.id],
  }),
}));
