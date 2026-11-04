ALTER TABLE "cobranca_gateway" ADD COLUMN "provedor" varchar(40) DEFAULT 'fake' NOT NULL;--> statement-breakpoint
ALTER TABLE "cobranca_gateway" ADD COLUMN "pagador" jsonb;