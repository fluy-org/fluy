import { relations, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { conviteProprietario } from "@schema/convite_proprietario/convite_proprietario.table.js";
import { usuario } from "@schema/usuario/usuario.table.js";
import type { OrigemAutorizacaoProprietario } from "./autorizacao_proprietario.enums.js";

export const autorizacaoProprietario = pgTable(
  "autorizacao_proprietario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    convite_id: uuid("convite_id").references(() => conviteProprietario.id, {
      onDelete: "restrict",
    }),
    referencia_convite_clerk: uuid("referencia_convite_clerk"),
    origem: varchar("origem", { length: 20 })
      .notNull()
      .$type<OrigemAutorizacaoProprietario>(),
    criado_em: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("autorizacao_proprietario_usuario_uq").on(t.usuario_id),
    uniqueIndex("autorizacao_proprietario_convite_uq").on(t.convite_id),
    uniqueIndex("autorizacao_proprietario_referencia_clerk_uq").on(
      t.referencia_convite_clerk,
    ),
    check(
      "autorizacao_proprietario_origem_ck",
      sql`${t.origem} in ('convite', 'legado')`,
    ),
    check(
      "autorizacao_proprietario_convite_origem_ck",
      sql`(
        (${t.origem} = 'convite' and num_nonnulls(${t.convite_id}, ${t.referencia_convite_clerk}) = 1)
        or
        (${t.origem} = 'legado' and ${t.convite_id} is null and ${t.referencia_convite_clerk} is null)
      )`,
    ),
  ],
);

export const autorizacaoProprietarioRelations = relations(
  autorizacaoProprietario,
  ({ one }) => ({
    usuario: one(usuario, {
      fields: [autorizacaoProprietario.usuario_id],
      references: [usuario.id],
    }),
    convite: one(conviteProprietario, {
      fields: [autorizacaoProprietario.convite_id],
      references: [conviteProprietario.id],
    }),
  }),
);
