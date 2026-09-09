import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { salao } from "../salao/salao.table.js";
import { agendamento } from "../agendamento/agendamento.table.js";
import { imagemProcedimento } from "../imagem_procedimento/imagem_procedimento.table.js";
import type { TipoSinal } from "./procedimento.enums.js";

export const procedimento = pgTable(
  "procedimento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    salao_id: uuid("salao_id")
      .notNull()
      .references(() => salao.id, { onDelete: "restrict" }),
    nome: varchar("nome", { length: 200 }).notNull(),
    descricao: text("descricao"),
    info_pre_procedimento: text("info_pre_procedimento"),
    duracao_min: integer("duracao_min").notNull(),
    preco: numeric("preco", { precision: 10, scale: 2 }).notNull(),
    tipo_sinal: varchar("tipo_sinal", {
      length: 20,
    })
      .notNull()
      .$type<TipoSinal>(),
    valor_sinal: numeric("valor_sinal", { precision: 10, scale: 2 }).notNull(),
    periodo_manutencao_dias: integer("periodo_manutencao_dias"),
    ativo: boolean("ativo").notNull().default(true),
    criado_em: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("procedimento_salao_criado_em_idx").on(t.salao_id, t.criado_em),
    index("procedimento_ativo_salao_criado_em_idx")
      .on(t.salao_id, t.criado_em)
      .where(sql`${t.ativo}`),
  ],
);

export const procedimentoRelations = relations(
  procedimento,
  ({ one, many }) => ({
    salao: one(salao, {
      fields: [procedimento.salao_id],
      references: [salao.id],
    }),
    agendamentos: many(agendamento),
    imagem: one(imagemProcedimento, {
      fields: [procedimento.id],
      references: [imagemProcedimento.procedimento_id],
    }),
  }),
);
