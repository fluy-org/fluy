ALTER TABLE "autorizacao_proprietario" DROP CONSTRAINT "autorizacao_proprietario_convite_origem_ck";--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario" ADD COLUMN "referencia_convite_clerk" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "autorizacao_proprietario_referencia_clerk_uq" ON "autorizacao_proprietario" USING btree ("referencia_convite_clerk");--> statement-breakpoint
ALTER TABLE "autorizacao_proprietario" ADD CONSTRAINT "autorizacao_proprietario_convite_origem_ck" CHECK ((
        ("autorizacao_proprietario"."origem" = 'convite' and num_nonnulls("autorizacao_proprietario"."convite_id", "autorizacao_proprietario"."referencia_convite_clerk") = 1)
        or
        ("autorizacao_proprietario"."origem" = 'legado' and "autorizacao_proprietario"."convite_id" is null and "autorizacao_proprietario"."referencia_convite_clerk" is null)
      ));
