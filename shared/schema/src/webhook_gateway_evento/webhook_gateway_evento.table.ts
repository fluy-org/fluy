import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type {
  TipoEventoGateway,
  StatusWebhookGateway,
} from './webhook_gateway_evento.enums.js';

export const webhookGatewayEvento = pgTable('webhook_gateway_evento', {
  id: uuid('id').primaryKey().defaultRandom(),
  id_externo: varchar('id_externo', { length: 200 }).notNull().unique(),
  tipo_bruto: varchar('tipo_bruto', { length: 100 }).notNull(),
  tipo_normalizado: varchar('tipo_normalizado', { length: 40 })
    .notNull()
    .$type<TipoEventoGateway>(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().$type<StatusWebhookGateway>(),
  erro_mensagem: text('erro_mensagem'),
  recebido_em: timestamp('recebido_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
  processado_em: timestamp('processado_em', { withTimezone: true }),
  atualizado_em: timestamp('atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
