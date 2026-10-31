CREATE TABLE IF NOT EXISTS "convite_proprietario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_convite_id" varchar(500),
	"email_normalizado" varchar(320) NOT NULL,
	"estado" varchar(20) DEFAULT 'pendente' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"consumido_por_usuario_id" uuid,
	"consumido_em" timestamp with time zone,
	"revogado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "autorizacao_proprietario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"convite_id" uuid,
	"referencia_convite_clerk" uuid,
	"origem" varchar(20) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario"
  ADD COLUMN IF NOT EXISTS "referencia_convite_clerk" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'convite_proprietario_email_normalizado_ck'
      AND conrelid = 'public.convite_proprietario'::regclass
  ) THEN
    ALTER TABLE "convite_proprietario"
      ADD CONSTRAINT "convite_proprietario_email_normalizado_ck"
      CHECK ("email_normalizado" = lower(btrim("email_normalizado")));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'convite_proprietario_estado_ck'
      AND conrelid = 'public.convite_proprietario'::regclass
  ) THEN
    ALTER TABLE "convite_proprietario"
      ADD CONSTRAINT "convite_proprietario_estado_ck"
      CHECK ("estado" in ('pendente', 'consumido', 'revogado'));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'convite_proprietario_transicao_ck'
      AND conrelid = 'public.convite_proprietario'::regclass
  ) THEN
    ALTER TABLE "convite_proprietario"
      ADD CONSTRAINT "convite_proprietario_transicao_ck" CHECK ((
        ("estado" = 'pendente' and "consumido_por_usuario_id" is null and "consumido_em" is null and "revogado_em" is null)
        or
        ("estado" = 'consumido' and "consumido_por_usuario_id" is not null and "consumido_em" is not null and "revogado_em" is null)
        or
        ("estado" = 'revogado' and "consumido_por_usuario_id" is null and "consumido_em" is null and "revogado_em" is not null)
      ));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'convite_proprietario_consumido_por_usuario_id_usuario_id_fk'
      AND conrelid = 'public.convite_proprietario'::regclass
  ) THEN
    ALTER TABLE "convite_proprietario"
      ADD CONSTRAINT "convite_proprietario_consumido_por_usuario_id_usuario_id_fk"
      FOREIGN KEY ("consumido_por_usuario_id") REFERENCES "public"."usuario"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'autorizacao_proprietario_usuario_id_usuario_id_fk'
      AND conrelid = 'public.autorizacao_proprietario'::regclass
  ) THEN
    ALTER TABLE "autorizacao_proprietario"
      ADD CONSTRAINT "autorizacao_proprietario_usuario_id_usuario_id_fk"
      FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'autorizacao_proprietario_convite_id_convite_proprietario_id_fk'
      AND conrelid = 'public.autorizacao_proprietario'::regclass
  ) THEN
    ALTER TABLE "autorizacao_proprietario"
      ADD CONSTRAINT "autorizacao_proprietario_convite_id_convite_proprietario_id_fk"
      FOREIGN KEY ("convite_id") REFERENCES "public"."convite_proprietario"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'autorizacao_proprietario_origem_ck'
      AND conrelid = 'public.autorizacao_proprietario'::regclass
  ) THEN
    ALTER TABLE "autorizacao_proprietario"
      ADD CONSTRAINT "autorizacao_proprietario_origem_ck"
      CHECK ("origem" in ('convite', 'legado'));
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario"
  DROP CONSTRAINT IF EXISTS "autorizacao_proprietario_convite_origem_ck";
--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario"
  ADD CONSTRAINT "autorizacao_proprietario_convite_origem_ck" CHECK ((
    ("origem" = 'convite' and num_nonnulls("convite_id", "referencia_convite_clerk") = 1)
    or
    ("origem" = 'legado' and "convite_id" is null and "referencia_convite_clerk" is null)
  ));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "convite_proprietario_clerk_convite_uq"
  ON "convite_proprietario" USING btree ("clerk_convite_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "convite_proprietario_email_pendente_uq"
  ON "convite_proprietario" USING btree ("email_normalizado")
  WHERE "estado" = 'pendente';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "convite_proprietario_email_estado_idx"
  ON "convite_proprietario" USING btree ("email_normalizado", "estado");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "autorizacao_proprietario_usuario_uq"
  ON "autorizacao_proprietario" USING btree ("usuario_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "autorizacao_proprietario_convite_uq"
  ON "autorizacao_proprietario" USING btree ("convite_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "autorizacao_proprietario_referencia_clerk_uq"
  ON "autorizacao_proprietario" USING btree ("referencia_convite_clerk");
--> statement-breakpoint
INSERT INTO "autorizacao_proprietario" ("usuario_id", "origem")
SELECT "id", 'legado'
FROM "usuario"
ON CONFLICT ("usuario_id") DO NOTHING;
