ALTER TABLE "lembrete" ADD COLUMN "notificado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "aviso" ADD COLUMN "lembrete_id" uuid;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_lembrete_id_lembrete_id_fk" FOREIGN KEY ("lembrete_id") REFERENCES "public"."lembrete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aviso_usuario_salao_lembrete_uq" ON "aviso" USING btree ("usuario_salao_id","lembrete_id") WHERE "aviso"."usuario_salao_id" is not null and "aviso"."lembrete_id" is not null;