CREATE TABLE "aviso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"cliente_id" uuid,
	"usuario_salao_id" uuid,
	"agendamento_id" uuid,
	"titulo" varchar(160) NOT NULL,
	"mensagem" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"reconhecido_em" timestamp with time zone,
	CONSTRAINT "aviso_destinatario_ck" CHECK (("aviso"."cliente_id" is not null)::int + ("aviso"."usuario_salao_id" is not null)::int = 1)
);
--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_usuario_salao_id_usuario_salao_id_fk" FOREIGN KEY ("usuario_salao_id") REFERENCES "public"."usuario_salao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aviso_cliente_pendente_idx" ON "aviso" USING btree ("salao_id","cliente_id","criado_em","id") WHERE "aviso"."cliente_id" is not null and "aviso"."reconhecido_em" is null;--> statement-breakpoint
CREATE INDEX "aviso_usuario_salao_pendente_idx" ON "aviso" USING btree ("salao_id","usuario_salao_id","criado_em","id") WHERE "aviso"."usuario_salao_id" is not null and "aviso"."reconhecido_em" is null;