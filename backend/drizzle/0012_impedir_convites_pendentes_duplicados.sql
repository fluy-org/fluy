CREATE UNIQUE INDEX "convite_proprietario_email_pendente_uq" ON "convite_proprietario" USING btree ("email_normalizado") WHERE "convite_proprietario"."estado" = 'pendente';
