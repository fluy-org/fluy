CREATE TABLE "salao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"subdominio" varchar(100) NOT NULL,
	"contato_whatsapp" varchar(30) NOT NULL,
	"endereco" text NOT NULL,
	"fuso_horario" varchar(60) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salao_subdominio_unique" UNIQUE("subdominio")
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"sobrenome" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_salao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"salao_id" uuid NOT NULL,
	"papel" varchar(20) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identidade_autenticacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"provedor" varchar(30) NOT NULL,
	"identificador_externo" varchar(500) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profissional" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"nome" varchar(301) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracao_salao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"granularidade_min" integer DEFAULT 30 NOT NULL,
	"prazo_reserva_min" integer DEFAULT 15 NOT NULL,
	"tolerancia_atraso_min" integer DEFAULT 15 NOT NULL,
	"antecedencia_min_horas" integer DEFAULT 2 NOT NULL,
	"antecedencia_max_dias" integer DEFAULT 60 NOT NULL,
	"mensagem_confirmacao" text,
	"politica_atraso" text,
	CONSTRAINT "configuracao_salao_salao_id_unique" UNIQUE("salao_id")
);
--> statement-breakpoint
CREATE TABLE "janela_semanal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profissional_id" uuid NOT NULL,
	"dia_semana" smallint NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fim" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "override_disponibilidade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profissional_id" uuid NOT NULL,
	"data" date NOT NULL,
	"fechado" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "janela_override" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"override_id" uuid NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fim" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"info_pre_procedimento" text,
	"duracao_min" integer NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"tipo_sinal" varchar(20) NOT NULL,
	"valor_sinal" numeric(10, 2) NOT NULL,
	"periodo_manutencao_dias" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"whatsapp" varchar(30) NOT NULL,
	"observacoes" text,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"removido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessao_cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"credencial" varchar(500) NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_uso_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salao_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"procedimento_id" uuid NOT NULL,
	"inicio_em" timestamp with time zone NOT NULL,
	"duracao_min" integer NOT NULL,
	"preco_total" numeric(10, 2) NOT NULL,
	"valor_sinal" numeric(10, 2) NOT NULL,
	"estado" varchar(20) NOT NULL,
	"expira_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evento_agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agendamento_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"ocorreu_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_gateway_evento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_externo" varchar(200) NOT NULL,
	"tipo_bruto" varchar(100) NOT NULL,
	"tipo_normalizado" varchar(40) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) NOT NULL,
	"erro_mensagem" text,
	"recebido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_gateway_evento_id_externo_unique" UNIQUE("id_externo")
);
--> statement-breakpoint
CREATE TABLE "cobranca_gateway" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_externo" varchar(200) NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"metodo" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmada_em" timestamp with time zone,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cobranca_gateway_id_externo_unique" UNIQUE("id_externo"),
	CONSTRAINT "cobranca_gateway_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "cobranca_manual" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"metodo" varchar(20) NOT NULL,
	"registrada_por" uuid NOT NULL,
	"registrada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamento_agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agendamento_id" uuid NOT NULL,
	"cobranca_gateway_id" uuid,
	"cobranca_manual_id" uuid,
	CONSTRAINT "pagamento_agendamento_cobranca_xor" CHECK (("pagamento_agendamento"."cobranca_gateway_id" IS NOT NULL)::int + ("pagamento_agendamento"."cobranca_manual_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "reembolso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cobranca_gateway_id" uuid,
	"cobranca_manual_id" uuid,
	"valor" numeric(10, 2) NOT NULL,
	"motivo" text,
	"id_externo_gateway" varchar(200),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmado_em" timestamp with time zone,
	CONSTRAINT "reembolso_cobranca_xor" CHECK (("reembolso"."cobranca_gateway_id" IS NOT NULL)::int + ("reembolso"."cobranca_manual_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "arquivo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url_storage" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"uploaded_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagem_procedimento" (
	"procedimento_id" uuid PRIMARY KEY NOT NULL,
	"arquivo_id" uuid NOT NULL,
	CONSTRAINT "imagem_procedimento_arquivo_id_unique" UNIQUE("arquivo_id")
);
--> statement-breakpoint
CREATE TABLE "anexo_agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agendamento_id" uuid NOT NULL,
	"arquivo_id" uuid NOT NULL,
	"visibilidade" varchar(30) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nota" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"agendamento_id" uuid,
	"texto" text NOT NULL,
	"autor_id" uuid NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lembrete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"agendamento_id" uuid,
	"procedimento_id" uuid,
	"texto" text NOT NULL,
	"data_alvo" date NOT NULL,
	"origem" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"autor_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"concluido_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "usuario_salao" ADD CONSTRAINT "usuario_salao_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_salao" ADD CONSTRAINT "usuario_salao_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identidade_autenticacao" ADD CONSTRAINT "identidade_autenticacao_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuracao_salao" ADD CONSTRAINT "configuracao_salao_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janela_semanal" ADD CONSTRAINT "janela_semanal_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "override_disponibilidade" ADD CONSTRAINT "override_disponibilidade_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janela_override" ADD CONSTRAINT "janela_override_override_id_override_disponibilidade_id_fk" FOREIGN KEY ("override_id") REFERENCES "public"."override_disponibilidade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedimento" ADD CONSTRAINT "procedimento_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_cliente" ADD CONSTRAINT "sessao_cliente_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_salao_id_salao_id_fk" FOREIGN KEY ("salao_id") REFERENCES "public"."salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_agendamento" ADD CONSTRAINT "evento_agendamento_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca_manual" ADD CONSTRAINT "cobranca_manual_registrada_por_usuario_salao_id_fk" FOREIGN KEY ("registrada_por") REFERENCES "public"."usuario_salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ADD CONSTRAINT "pagamento_agendamento_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ADD CONSTRAINT "pagamento_agendamento_cobranca_gateway_id_cobranca_gateway_id_fk" FOREIGN KEY ("cobranca_gateway_id") REFERENCES "public"."cobranca_gateway"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_agendamento" ADD CONSTRAINT "pagamento_agendamento_cobranca_manual_id_cobranca_manual_id_fk" FOREIGN KEY ("cobranca_manual_id") REFERENCES "public"."cobranca_manual"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_cobranca_gateway_id_cobranca_gateway_id_fk" FOREIGN KEY ("cobranca_gateway_id") REFERENCES "public"."cobranca_gateway"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_cobranca_manual_id_cobranca_manual_id_fk" FOREIGN KEY ("cobranca_manual_id") REFERENCES "public"."cobranca_manual"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagem_procedimento" ADD CONSTRAINT "imagem_procedimento_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagem_procedimento" ADD CONSTRAINT "imagem_procedimento_arquivo_id_arquivo_id_fk" FOREIGN KEY ("arquivo_id") REFERENCES "public"."arquivo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexo_agendamento" ADD CONSTRAINT "anexo_agendamento_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexo_agendamento" ADD CONSTRAINT "anexo_agendamento_arquivo_id_arquivo_id_fk" FOREIGN KEY ("arquivo_id") REFERENCES "public"."arquivo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota" ADD CONSTRAINT "nota_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota" ADD CONSTRAINT "nota_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota" ADD CONSTRAINT "nota_autor_id_usuario_salao_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuario_salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_autor_id_usuario_salao_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuario_salao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usuario_salao_usuario_salao_uq" ON "usuario_salao" USING btree ("usuario_id","salao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuario_salao_dono_usuario_uq" ON "usuario_salao" USING btree ("usuario_id") WHERE "usuario_salao"."papel" = 'dono';--> statement-breakpoint
CREATE UNIQUE INDEX "identidade_autenticacao_provedor_identificador_externo_uq" ON "identidade_autenticacao" USING btree ("provedor","identificador_externo");--> statement-breakpoint
CREATE UNIQUE INDEX "override_disponibilidade_profissional_data_uq" ON "override_disponibilidade" USING btree ("profissional_id","data");--> statement-breakpoint
CREATE UNIQUE INDEX "cliente_salao_whatsapp_uq" ON "cliente" USING btree ("salao_id","whatsapp");--> statement-breakpoint
CREATE UNIQUE INDEX "sessao_cliente_tipo_credencial_uq" ON "sessao_cliente" USING btree ("tipo","credencial");
