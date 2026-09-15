# Features do Fluy

Esta pasta contém a documentação de **features** do Fluy — uma camada intermediária entre os [fluxos funcionais](../fluxos) e a implementação.

- Os **fluxos** respondem: "como o usuário utiliza o sistema e quais regras existem?"
- As **features** respondem: "quais capacidades o sistema precisa possuir para que esses fluxos existam?"

Fluxos permanecem como **fonte oficial e canônica** para regras de negócio, validações, exceções, estados e comportamentos detalhados. Features não os substituem — apenas os agrupam por capacidade.

Cada feature segue a estrutura descrita em [../fluxos/README.md](../fluxos/README.md) e aponta para os fluxos relevantes.

## Índice de features

### Fundação (setup do salão)

- [Conta e Autenticação](./conta-e-autenticacao.md) — onboarding, login, sessão
- [Configuração do Salão](./configuracao-do-salao.md) — parâmetros operacionais (tolerância, granularidade, antecedências, mensagens)
- [Gestão de Disponibilidade](./gestao-disponibilidade.md) — template semanal + overrides por data
- [Gestão de Procedimentos](./gestao-procedimentos.md) — catálogo de serviços

### Ciclo de vida da cliente

- [Identificação da Cliente](./identificacao-cliente.md) — sem login; UUID por dispositivo + WhatsApp
- [Gestão de Clientes e Histórico](./gestao-clientes.md) — ficha, timeline, métricas

### Motor central

- [Gestão de Agendamentos](./gestao-agendamentos.md) — criação (cliente e manual), remarcação, cancelamentos, no-show, conclusão, estados
- [Agenda do Dia](./agenda-do-dia.md) — visão operacional + ações rápidas

### Transversais

- [Pagamentos](./pagamentos.md) — sinal via gateway + registros manuais + reembolso
- [Notificações](./notificacoes.md) — push PWA, in-app, `.ics`
- [Anexos](./anexos.md) — imagens de referência e internas

### Operação e financeiro

- [Lembretes Internos](./lembretes-internos.md) — automáticos (manutenção) + manuais
- [Faturamento](./faturamento.md) — fechamento de período

## Como usar

1. Ao iniciar a implementação de uma capacidade, comece lendo o `.md` correspondente em `features/`.
2. Siga a lista de **Documentos de referência** para acessar os fluxos e entender comportamentos detalhados, regras e casos extremos.
3. Consulte também [../fluxos/PENDENCIAS.md](../fluxos/PENDENCIAS.md) para verificar decisões adiadas que impactam a feature.
4. Se identificar que uma feature está desatualizada em relação a um fluxo, atualize-a — as features devem espelhar o agrupamento das capacidades, não uma fotografia congelada.

## Regras de manutenção

- **Não duplicar regras dos fluxos.** Se uma regra é importante, cite o fluxo onde ela vive.
- **Não incluir implementação** (tabelas, endpoints, componentes, código, arquitetura).
- **Features agrupam capacidades**, não fluxos 1:1. Reagrupe quando um novo fluxo for melhor absorvido por uma feature existente.

## Dúvidas encontradas durante a construção destas features

Nenhuma decisão foi inventada. Os pontos abaixo emergiram da leitura dos fluxos e ficam registrados aqui para discussão:

### Ambiguidades no material atual

1. ~~**Conclusão em agendamento futuro**~~ — **decidido (2026-09-14): permitir com aviso.** A regra vive agora em [gestao-agendamentos.md](./gestao-agendamentos.md) e no fluxo 07.
2. ~~**Override de janela**~~ ao criar agendamento manual e ao remarcar — **decidido (2026-09-14): permitir com aviso**, mesma regra nos dois fluxos. Data com override "sem atendimento" continua bloqueada.
3. **Tratamento do sinal no cancelamento pelo salão** (08-cancelamento.md): PENDENCIAS.md aponta que sistema precisa decidir entre "reembolso automático via gateway" ou "reembolso manual". Trava com a escolha do gateway.
4. ~~**Marcar no-show antes de expirar a tolerância**~~ — **decidido (2026-09-14): permitir com aviso.** A divergência entre os fluxos 06 e 10 foi resolvida nos dois; antes de `hora_agendada` continua bloqueado.
5. **Cancelamento de agendamento passado pelo salão** (08-cancelamento.md): descrito como variação legítima ("correção de registros"); precisa alinhar com "cancelamento é irreversível" e com faturamento (rebate no período atual vs. reabrir).
6. **Comportamento offline do painel do salão** (06-agenda-dia.md): edge case levanta "ações bufferizadas ou bloqueadas (decidir)". Sem decisão, agenda pode se comportar diferente em cada tela.
7. **"Salão pode marcar agendamento manual como 'não avisar a cliente'"** (05-agendamento-manual.md) — sugerido como checkbox opcional; ninguém confirmou se entra no MVP.
8. **Cliente com múltiplos agendamentos simultâneos no mesmo salão** (03-criacao-agendamento.md, PENDENCIAS.md): "provavelmente permitir; confirmar". Ainda não confirmado; impacta validação na criação.

### Dependências externas ainda não escolhidas

9. **Gateway de pagamento** (Woovi vs. Asaas): trava métodos aceitos, política de reembolso, formato de webhook, split vs. conta direta. Ver PENDENCIAS.md item 1.

### Aspectos legais e de segurança sem cobertura

10. **LGPD** (consentimento, exclusão, portabilidade, retenção, auditoria): PENDENCIAS.md item 3 aponta que precisa entrar cedo — nenhum fluxo cobre hoje.
11. **Validação real de identidade da cliente** (código no WhatsApp vs. só formato): PENDENCIAS.md item 7. MVP aceita WhatsApp inventado.
12. **Verificação de email no onboarding** do salão (01-onboarding.md): recomendada como proteção anti-spam, mas não decidida.

### Escopo transversal a definir

13. **Estratégia de tempo real** (websocket vs. polling curto) para a [agenda do dia](./agenda-do-dia.md) e para receber pushes de novo agendamento / cancelamento. Escolha impacta várias features.
14. **Schema do deep link** de push PWA (05-notificacao-alteracao.md): precisa ser definido para os pushes abrirem no lugar certo do app.
