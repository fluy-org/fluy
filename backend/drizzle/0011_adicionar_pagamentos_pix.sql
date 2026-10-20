ALTER TABLE "cobranca_gateway" ALTER COLUMN "id_externo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "configuracao_salao" ADD COLUMN "pix_tipo_chave" varchar(20);--> statement-breakpoint
ALTER TABLE "configuracao_salao" ADD COLUMN "pix_chave" varchar(200);--> statement-breakpoint
ALTER TABLE "configuracao_salao" ADD COLUMN "pix_nome_recebedor" varchar(200);--> statement-breakpoint
ALTER TABLE "configuracao_salao" ADD COLUMN "pix_atualizado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "webhook_gateway_evento" ADD COLUMN "salao_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_gateway_evento" ADD COLUMN "cobranca_gateway_id" uuid;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "salao_id" uuid;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "agendamento_id" uuid;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "modalidade" varchar(20);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "taxa_cliente" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "total_cliente" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "pix_tipo_chave" varchar(20);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "pix_chave" varchar(200);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "pix_nome_recebedor" varchar(200);--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "instrucao_cliente" jsonb;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "divergencia" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ADD COLUMN "valor" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "webhook_gateway_evento" ADD CONSTRAINT "webhook_gateway_evento_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_gateway_evento" ADD CONSTRAINT "webhook_gateway_evento_cobranca_gateway_id_cobranca_gateway_id_fk" FOREIGN KEY ("cobranca_gateway_id") REFERENCES "public"."cobranca_gateway"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD CONSTRAINT "cobranca_gateway_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD CONSTRAINT "cobranca_gateway_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE restrict ON UPDATE no action;