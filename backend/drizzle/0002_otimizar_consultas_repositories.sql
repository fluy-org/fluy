CREATE INDEX "procedimento_salao_criado_em_idx" ON "procedimento" USING btree ("salao_id","criado_em");--> statement-breakpoint
CREATE INDEX "procedimento_ativo_salao_criado_em_idx" ON "procedimento" USING btree ("salao_id","criado_em") WHERE "procedimento"."ativo";--> statement-breakpoint
CREATE INDEX "arquivo_uploaded_em_id_idx" ON "arquivo" USING btree ("uploaded_em","id");--> statement-breakpoint
CREATE INDEX "anexo_agendamento_arquivo_id_idx" ON "anexo_agendamento" USING btree ("arquivo_id");
