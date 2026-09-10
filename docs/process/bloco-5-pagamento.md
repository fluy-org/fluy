# Bloco 5 — Pagamento online

Destrava com decisão de gateway. Adiciona pagamento online ao produto.

**Todo este bloco está `[BLOQ:gateway]` até a escolha ser feita.** Assim que decidido (Woovi vs. Asaas vs. outro), começa.

## Entregável do bloco

Ao final:
- Cliente paga sinal ao marcar horário (5.2).
- Cancelamento pelo salão gera reembolso automático quando aplicável (5.3).
- Conclusão de atendimento pode gerar cobrança online do valor restante (5.4).

## Fatias

### 5.1 Modulo de pagamento

- [ ] Módulo `pagamento` — integração com o gateway escolhido. Entities: `webhook_gateway_evento`, `cobranca_gateway`, `reembolso`. Endpoints: criar cobrança, receber webhook, dedupe. — **🟣 Rudney** — `[BLOQ:gateway]`

### 5.2 Pagamento de sinal

- [ ] Alterar `cliente/03-criacao-agendamento` — introduzir estado `reservado`, `expira_em`, tela de pagamento do sinal, callback de confirmação. Alterações em 4.3 e no motor de criação da 2.2b. — **🔵 Leandro** (frontend do checkout) + **🟣 Rudney** (integração com 5.1) — [DEP: 5.1](#51-modulo-de-pagamento) · [DEP: 4.3](./bloco-4-cliente-final.md#43-criacao-de-agendamento)

### 5.3 Reembolso automatico

- [ ] Alterar `salao/08-cancelamento` — reembolso automático quando aplicável. Altera 2.6. — **🟣 Rudney** — [DEP: 5.1](#51-modulo-de-pagamento) · [DEP: 2.6](./bloco-2-motor.md#26-cancelamento) `[DECIDIR: política de reembolso — ambig #3]`

### 5.4 Cobranca online do restante

- [ ] Alterar `salao/07-conclusao-atendimento` — se ainda faltar valor, opção de gerar cobrança online para o restante. Altera 2.4. — **🔵 Leandro** — [DEP: 5.1](#51-modulo-de-pagamento) · [DEP: 2.4](./bloco-2-motor.md#24-conclusao-de-atendimento)

## Divisão e por quê

**🟣 Rudney** (2 completas + metade de 5.2): 5.1 (integração gateway — infra e regra de negócio densa no back, casa com o que ele conhece), 5.3 (reembolso — regra de negócio), metade back de 5.2.

**🔵 Leandro** (1 completa + metade de 5.2): 5.4 (tela de cobrança do restante — UX de conclusão), metade front de 5.2.

**Alternância:** já cristalizou um pouco (🟣 Rudney no back de pagamento, 🔵 Leandro no front de checkout). Aceitável porque pagamento tem regra técnica pesada (webhooks, idempotência, split) que se beneficia de continuidade. Se o Bloco 5 durar mais de 3 semanas, trocar de lado deliberadamente.

**Sequência:**
1. 🟣 Rudney faz 5.1 sozinho (bloqueia todos os outros).
2. Depois de 5.1 mergeada:
   - 🔵 Leandro pega 5.4 (independente das outras).
   - 🟣 Rudney começa 5.3.
   - 5.2 fica para os dois em par (é a fatia mais crítica — mudança de estado do agendamento afeta tudo).

## Decisões pendentes deste bloco

- [ ] **Escolher gateway** (Woovi vs. Asaas vs. outro). Bloqueia bloco inteiro.
- [ ] **Titular da conta de recebimento**: salão direto ou split via Fluy? Impacta 5.1 e onboarding.
- [ ] **Política de reembolso** (ambig #3, pendência 1): automático via gateway ou manual? Impacta 5.3.
- [ ] **Métodos aceitos**: só PIX ou PIX + cartão? Depende do gateway.
- [ ] **`expira_em` — quanto tempo** dura um `reservado` sem confirmação de pagamento? Recomendação: 10-15 min.

## Notas

- **5.2 é a fatia mais delicada do Bloco 5.** Ela reintroduz o estado `reservado` que foi pulado em 4.3, o que muda a máquina de estados do agendamento. Preferir par.
- Estado `reservado` já está previsto na entity `agendamento` (campo `expira_em` opcional) — não precisa mudar schema, só ativar o fluxo.
- Webhooks são a parte mais chata da 5.1. Testar dedupe (mesmo evento chegando 2x) com muita atenção — regra de negócio crítica.
