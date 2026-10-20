CREATE TABLE "convite_proprietario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_convite_id" varchar(500),
	"email_normalizado" varchar(320) NOT NULL,
	"estado" varchar(20) DEFAULT 'pendente' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"consumido_por_usuario_id" uuid,
	"consumido_em" timestamp with time zone,
	"revogado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "convite_proprietario_email_normalizado_ck" CHECK ("convite_proprietario"."email_normalizado" = lower(btrim("convite_proprietario"."email_normalizado"))),
	CONSTRAINT "convite_proprietario_estado_ck" CHECK ("convite_proprietario"."estado" in ('pendente', 'consumido', 'revogado')),
	CONSTRAINT "convite_proprietario_transicao_ck" CHECK ((
        ("convite_proprietario"."estado" = 'pendente' and "convite_proprietario"."consumido_por_usuario_id" is null and "convite_proprietario"."consumido_em" is null and "convite_proprietario"."revogado_em" is null)
        or
        ("convite_proprietario"."estado" = 'consumido' and "convite_proprietario"."consumido_por_usuario_id" is not null and "convite_proprietario"."consumido_em" is not null and "convite_proprietario"."revogado_em" is null)
        or
        ("convite_proprietario"."estado" = 'revogado' and "convite_proprietario"."consumido_por_usuario_id" is null and "convite_proprietario"."consumido_em" is null and "convite_proprietario"."revogado_em" is not null)
      ))
);
--> statement-breakpoint
CREATE TABLE "autorizacao_proprietario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"convite_id" uuid,
	"origem" varchar(20) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "autorizacao_proprietario_origem_ck" CHECK ("autorizacao_proprietario"."origem" in ('convite', 'legado')),
	CONSTRAINT "autorizacao_proprietario_convite_origem_ck" CHECK ((
        ("autorizacao_proprietario"."origem" = 'convite' and "autorizacao_proprietario"."convite_id" is not null)
        or
        ("autorizacao_proprietario"."origem" = 'legado' and "autorizacao_proprietario"."convite_id" is null)
      ))
);
--> statement-breakpoint
ALTER TABLE "convite_proprietario" ADD CONSTRAINT "convite_proprietario_consumido_por_usuario_id_usuario_id_fk" FOREIGN KEY ("consumido_por_usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario" ADD CONSTRAINT "autorizacao_proprietario_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario" ADD CONSTRAINT "autorizacao_proprietario_convite_id_convite_proprietario_id_fk" FOREIGN KEY ("convite_id") REFERENCES "public"."convite_proprietario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "convite_proprietario_clerk_convite_uq" ON "convite_proprietario" USING btree ("clerk_convite_id");--> statement-breakpoint
CREATE INDEX "convite_proprietario_email_estado_idx" ON "convite_proprietario" USING btree ("email_normalizado","estado");--> statement-breakpoint
CREATE UNIQUE INDEX "autorizacao_proprietario_usuario_uq" ON "autorizacao_proprietario" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autorizacao_proprietario_convite_uq" ON "autorizacao_proprietario" USING btree ("convite_id");--> statement-breakpoint
-- Todo usuário já materializado antes desta proteção continua autorizado.
-- O ON CONFLICT torna o backfill seguro em ambientes que já tenham recebido
-- uma autorização por outro caminho durante a implantação.
INSERT INTO "autorizacao_proprietario" ("usuario_id", "origem")
SELECT "id", 'legado'
FROM "usuario"
ON CONFLICT ("usuario_id") DO NOTHING;
