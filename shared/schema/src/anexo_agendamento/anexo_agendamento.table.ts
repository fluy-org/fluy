import { relations } from "drizzle-orm";
import { index, pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { agendamento } from "../agendamento/agendamento.table.js";
import { arquivo } from "../arquivo/arquivo.table.js";
import type { VisibilidadeAnexo } from "./anexo_agendamento.enums.js";

export const anexoAgendamento = pgTable(
  "anexo_agendamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agendamento_id: uuid("agendamento_id")
      .notNull()
      .references(() => agendamento.id, { onDelete: "cascade" }),
    arquivo_id: uuid("arquivo_id")
      .notNull()
      .references(() => arquivo.id, { onDelete: "restrict" }),
    visibilidade: varchar("visibilidade", { length: 30 })
      .notNull()
      .$type<VisibilidadeAnexo>(),
    criado_em: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("anexo_agendamento_arquivo_id_idx").on(t.arquivo_id)],
);

export const anexoAgendamentoRelations = relations(
  anexoAgendamento,
  ({ one }) => ({
    agendamento: one(agendamento, {
      fields: [anexoAgendamento.agendamento_id],
      references: [agendamento.id],
    }),
    arquivo: one(arquivo, {
      fields: [anexoAgendamento.arquivo_id],
      references: [arquivo.id],
    }),
  }),
);
