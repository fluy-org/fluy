ALTER TABLE "evento_agendamento" ADD COLUMN "cancelado_por" varchar(20);--> statement-breakpoint
-- O cancelamento pela cliente grava esse motivo fixo; até aqui era o único
-- rastro de quem cancelou.
UPDATE "evento_agendamento"
SET "cancelado_por" = CASE
  WHEN "motivo" = 'Cancelado pela cliente.' THEN 'cliente'
  ELSE 'salao'
END
WHERE "tipo" = 'cancelado';--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ADD COLUMN "tipo" varchar(20);--> statement-breakpoint
-- Até o pagamento online, só a conclusão cria vínculo de pagamento: todo
-- vínculo existente é do restante.
UPDATE "pagamento_agendamento" SET "tipo" = 'restante';--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ALTER COLUMN "tipo" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "evento_agendamento_tipo_ocorreu_em_idx" ON "evento_agendamento" USING btree ("tipo","ocorreu_em");
