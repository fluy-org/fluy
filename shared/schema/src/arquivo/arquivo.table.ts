import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { imagemProcedimento } from '@schema/imagem_procedimento/imagem_procedimento.table.js';
import { anexoAgendamento } from '@schema/anexo_agendamento/anexo_agendamento.table.js';

export const arquivo = pgTable('arquivo', {
  id: uuid('id').primaryKey().defaultRandom(),
  url_storage: text('url_storage').notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  tamanho_bytes: integer('tamanho_bytes').notNull(),
  uploaded_em: timestamp('uploaded_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const arquivoRelations = relations(arquivo, ({ one, many }) => ({
  imagem_procedimento: one(imagemProcedimento, {
    fields: [arquivo.id],
    references: [imagemProcedimento.arquivo_id],
  }),
  anexos_agendamento: many(anexoAgendamento),
}));
