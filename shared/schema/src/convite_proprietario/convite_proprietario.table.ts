import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usuario } from "@schema/usuario/usuario.table.js";
import type { EstadoConviteProprietario } from "./convite_proprietario.enums.js";

export const conviteProprietario = pgTable(
  "convite_proprietario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerk_convite_id: varchar("clerk_convite_id", { length: 500 }),
    email_normalizado: varchar("email_normalizado", { length: 320 }).notNull(),
    estado: varchar("estado", { length: 20 })
      .notNull()
      .$type<EstadoConviteProprietario>()
      .default("pendente"),
    expira_em: timestamp("expira_em", { withTimezone: true }).notNull(),
    consumido_por_usuario_id: uuid("consumido_por_usuario_id").references(
      () => usuario.id,
      { onDelete: "restrict" },
    ),
    consumido_em: timestamp("consumido_em", { withTimezone: true }),
    revogado_em: timestamp("revogado_em", { withTimezone: true }),
    criado_em: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("convite_proprietario_clerk_convite_uq").on(t.clerk_convite_id),
    uniqueIndex("convite_proprietario_email_pendente_uq")
      .on(t.email_normalizado)
      .where(sql`${t.estado} = 'pendente'`),
    index("convite_proprietario_email_estado_idx").on(
      t.email_normalizado,
      t.estado,
    ),
    check(
      "convite_proprietario_email_normalizado_ck",
      sql`${t.email_normalizado} = lower(btrim(${t.email_normalizado}))`,
    ),
    check(
      "convite_proprietario_estado_ck",
      sql`${t.estado} in ('pendente', 'consumido', 'revogado')`,
    ),
    check(
      "convite_proprietario_transicao_ck",
      sql`(
        (${t.estado} = 'pendente' and ${t.consumido_por_usuario_id} is null and ${t.consumido_em} is null and ${t.revogado_em} is null)
        or
        (${t.estado} = 'consumido' and ${t.consumido_por_usuario_id} is not null and ${t.consumido_em} is not null and ${t.revogado_em} is null)
        or
        (${t.estado} = 'revogado' and ${t.consumido_por_usuario_id} is null and ${t.consumido_em} is null and ${t.revogado_em} is not null)
      )`,
    ),
  ],
);

export const conviteProprietarioRelations = relations(
  conviteProprietario,
  ({ one }) => ({
    usuario_consumidor: one(usuario, {
      fields: [conviteProprietario.consumido_por_usuario_id],
      references: [usuario.id],
    }),
  }),
);
