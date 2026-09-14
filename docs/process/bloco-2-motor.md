# Bloco 2 — Motor operacional

O coração do produto. Aqui o salão passa a operar de verdade.

## Entregável do bloco

Ao final, um salão consegue:
- Cadastrar clientes (via CRUD ou inline no agendamento).
- Criar agendamento manual (dono/funcionário marca pelo painel).
- Ver a agenda do dia.
- Concluir atendimento com pagamento manual (dinheiro/PIX registrado à mão).
- Cancelar, remarcar, marcar no-show.
- Ver histórico de cada cliente.
- Anexar imagens (referências e internas) aos agendamentos.

**Pagamento online continua fora** (Bloco 5).

## Fatias

### 2.1 Clientes

- [ ] `cliente` entity + CRUD backend + tela mínima de listagem — **🔵 Leandro** — [DEP: 1.1](./bloco-1-setup-salao.md#11-onboarding)

### 2.1b Extrair cliente do motor de agendamento

- [ ] Após criar `ClienteModule`, mover a validação temporária de cliente ativo do `AgendamentoService` para `ClienteService`. — **🔵 Leandro** — [DEP: 2.1](#21-clientes) · [DEP: 2.2b](#22b-motor-de-agendamento)

### 2.2a Tela de agendamento manual

- [ ] Tela do painel: buscar/criar cliente, selecionar procedimento, escolher horário e tratar conflitos. Trabalha contra o contrato da API com mock local até a integração. — **🔵 Leandro** — [DEP: 2.1](#21-clientes) · [DEP: 1.3-FE](./bloco-1-setup-salao.md#13-fe-tela-de-procedimentos) `[SEED-OK]`

### 2.2b Motor de agendamento

- [x] API de horários livres e criação transacional: compõe janelas + overrides + duração, revalida o slot, aloca profissional e cria direto em `agendado` com duração/preços congelados. Testa com cliente seed, sem depender do CRUD 2.1. — **🟣 Rudney** — [DEP: 1.3-BE](./bloco-1-setup-salao.md#13-be-procedimentos) · [DEP: 1.4-BE](./bloco-1-setup-salao.md#14-be-disponibilidade) `[SEED-OK]` `[BLOQ:pagamento-sinal-desabilitado — sinal e gateway ficam para Bloco 5]`

### 2.2c Integrar fluxo manual

- [ ] Trocar o mock pela API real e validar o fluxo ponta a ponta. O frontend consome os contratos já publicados pelo motor; alterações em schema, controller, service, repository ou regra de disponibilidade exigem uma nova fase de backend, com revisão específica. — **livre (quem terminar primeiro)** — [DEP: 2.2a](#22a-tela-de-agendamento-manual) · [DEP: 2.2b](#22b-motor-de-agendamento)

**Critério de conclusão:** a tela usa os endpoints de horários livres, avaliação e criação; apresenta bloqueios e exige confirmação para avisos; e o fluxo manual é validado ponta a ponta contra a API real.

### 2.3 Agenda do dia

- [ ] `salao/06-agenda-dia` — visualização diária + navegação semanal. Só leitura + navegação (ações são das outras fatias). — **🟣 Rudney** — [DEP: 2.2b](#22b-motor-de-agendamento) OU `[SEED-OK]`

### 2.4 Conclusao de atendimento

- [ ] `salao/07-conclusao-atendimento` — marcar concluído, registrar pagamento manual (dinheiro/PIX). Entities: `cobranca_manual`, `pagamento_agendamento`. — **🔵 Leandro** — [DEP: 2.2b](#22b-motor-de-agendamento) `[DECIDIR: permite conclusão em data futura? (ambig #1)]`

### 2.5 No-show

- [ ] `salao/10-no-show` — marcar falta. — **🟣 Rudney** — [DEP: 2.2b](#22b-motor-de-agendamento) `[DECIDIR: marcar antes de expirar tolerância? (ambig #4)]`

### 2.6 Cancelamento

- [ ] `salao/08-cancelamento` — cancelar pelo salão. Parte sem reembolso (só registra estado). — **🔵 Leandro** — [DEP: 2.2b](#22b-motor-de-agendamento) `[BLOQ:gateway — reembolso automático fica para 5.3]`

### 2.7 Remarcacao

- [ ] `salao/09-remarcacao` — remarcar (mudar horário, mesmo agendamento). — **🟣 Rudney** — [DEP: 2.2b](#22b-motor-de-agendamento) `[DECIDIR: override de janela ao remarcar? (ambig #2)]`

### 2.8 Historico de clientes

- [ ] `salao/11-clientes-historico` — ficha da cliente + histórico de agendamentos + notas. Entities: `nota`. — **🔵 Leandro** — [DEP: 2.1](#21-clientes) · [DEP: 2.2b](#22b-motor-de-agendamento) `[SEED-OK]`

### 2.9 Anexos em agendamento

- [ ] Anexos em agendamento — upload de imagem interna/pública. Entities: `anexo_agendamento`. — **🟣 Rudney** — [DEP: 1.6](./bloco-1-setup-salao.md#16-be-anexos) · [DEP: 2.2b](#22b-motor-de-agendamento)

## Divisão e por quê

**2.2a e 2.2b rodam em paralelo.** Antes de começar, Leandro e Rudney combinam
o contrato HTTP (entradas, resposta de horários e erros). Leandro usa esse
contrato em um mock local; Rudney valida o motor com cliente seed. A 2.2c é só
a integração curta e pode ser puxada por quem ficar livre primeiro.

Distribuição das fatias:

**🔵 Leandro** (5): 2.1 (cliente CRUD — fullstack), 2.2a (tela manual), 2.4 (conclusão + pagamento manual — regra de negócio), 2.6 (cancelamento — estado), 2.8 (histórico — tela densa).
**🟣 Rudney** (5): 2.2b (motor de agendamento), 2.3 (agenda do dia — tela densa também), 2.5 (no-show), 2.7 (remarcação — lógica de conflito de horário), 2.9 (anexos em agendamento).

**2.2c** fica livre para quem terminar primeiro.

**Balanceamento:** 5 fatias para cada um; 2.2c é uma integração curta e livre.

**Alternância de stack:** 🔵 Leandro pega fatias com regra de negócio no back (2.4, 2.6) e frontend denso (2.8). 🟣 Rudney pega tela densa (2.3) e lógica de horário (2.7). Ninguém especializa.

**Sequência sugerida:**
1. 🔵 Leandro faz 2.1 e 2.2a; 🟣 Rudney faz 2.2b em paralelo usando seed.
2. Com ambas prontas, quem estiver livre integra a 2.2c.
3. Depois de 2.2c mergeada, 2.3-2.9 caem no backlog. Cada um puxa da sua lista, em qualquer ordem.

## Decisões pendentes deste bloco

- [ ] **Ambig #1** (2.4): permitir marcar conclusão em data futura? Recomendação atual: bloquear. Decidir antes de 2.4.
- [ ] **Ambig #2** (2.7): override de janela ao remarcar — bloquear, permitir com aviso, ou permitir silenciosamente? Recomendação atual: permitir com aviso.
- [ ] **Ambig #4** (2.5): marcar no-show antes da tolerância expirar? Fluxos divergem (10 diz "proibido", 06 diz "decidir"). Recomendação: alinhar com 10 (proibir).
- [ ] **Ambig #5** (2.6): cancelamento de agendamento passado pelo salão — como interage com faturamento? Rebate no período atual ou reabre?
- [ ] Cliente com múltiplos agendamentos simultâneos permitido? Provavelmente sim; confirmar em 2.2b.

## Conflitos previstos e mitigação

- **`AgendamentoService`** vira ponto quente: 2.4, 2.5, 2.6, 2.7 vão querer adicionar métodos (`concluir`, `marcarNoShow`, `cancelar`, `remarcar`). **Mitigação:** cada método em arquivo/service separado desde 2.2b (`AgendamentoConclusaoService`, etc.). Se preferirem manter tudo no `AgendamentoService`, coordenar verbalmente ("tô mexendo hoje").
- **`AgendamentoController`**: mesma coisa — cada endpoint pode virar arquivo separado (`agendamento-conclusao.controller.ts`) ou coordenação verbal.
- Todas as outras fatias tocam entidades/telas diferentes, conflito não esperado.

## Notas

- **2.1** entrega `cliente` inteiro (entity já criada em 0.4 sem service). 🔵 Leandro adiciona service + controller + tela.
- **2.2a–2.2c**: três PRs curtos — tela com mock, motor com seed e integração final. O contrato HTTP é combinado antes dos dois primeiros PRs; o teste manual completo fecha a 2.2c.
