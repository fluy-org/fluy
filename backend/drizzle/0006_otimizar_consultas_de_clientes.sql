CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE INDEX "agendamento_cliente_inicio_idx" ON "agendamento" USING btree ("cliente_id","inicio_em");