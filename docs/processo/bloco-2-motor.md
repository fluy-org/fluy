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

- [ ] **2.1** `cliente` entity + CRUD backend + tela mínima de listagem — **🔵 Leandro** — `[DEP: 1.1]`
- [ ] **2.2** `salao/05-agendamento-manual` — **PAR OBRIGATÓRIO (🔵 Leandro + 🟣 Rudney)**. Motor central. Entities: `agendamento`, `evento_agendamento`. Fluxo: escolher cliente (ou criar inline) → escolher procedimento → escolher horário livre → criar agendamento. Vai direto para `agendado` (sem `reservado`/sinal). — `[DEP: 1.3, 1.4, 2.1]` `[BLOQ:pagamento-sinal-desabilitado — parte "cobrar sinal" fica para Bloco 5]`
- [ ] **2.3** `salao/06-agenda-dia` — visualização diária + navegação semanal. Só leitura + navegação (ações são das outras fatias). — **🟣 Rudney** — `[DEP: 2.2 OU SEED-OK]`
- [ ] **2.4** `salao/07-conclusao-atendimento` — marcar concluído, registrar pagamento manual (dinheiro/PIX). Entities: `cobranca_manual`, `pagamento_agendamento`. — **🔵 Leandro** — `[DEP: 2.2]` `[DECIDIR: permite conclusão em data futura? (ambig #1)]`
- [ ] **2.5** `salao/10-no-show` — marcar falta. — **🟣 Rudney** — `[DEP: 2.2]` `[DECIDIR: marcar antes de expirar tolerância? (ambig #4)]`
- [ ] **2.6** `salao/08-cancelamento` — cancelar pelo salão. Parte sem reembolso (só registra estado). — **🔵 Leandro** — `[DEP: 2.2]` `[BLOQ:gateway — reembolso automático fica para 5.3]`
- [ ] **2.7** `salao/09-remarcacao` — remarcar (mudar horário, mesmo agendamento). — **🟣 Rudney** — `[DEP: 2.2]` `[DECIDIR: override de janela ao remarcar? (ambig #2)]`
- [ ] **2.8** `salao/11-clientes-historico` — ficha da cliente + histórico de agendamentos + notas. Entities: `nota`. — **🔵 Leandro** — `[DEP: 2.1, 2.2]` `[SEED-OK]`
- [ ] **2.9** Anexos em agendamento — upload de imagem interna/pública. Entities: `anexo_agendamento`. — **🟣 Rudney** — `[DEP: 1.6, 2.2]`

## Divisão e por quê

**2.2 é par obrigatório.** Integra 5 módulos, é a fatia raiz do produto, ganho de qualidade em par é enorme. Não divide.

Fora 2.2:

**🔵 Leandro** (4): 2.1 (cliente CRUD — fullstack), 2.4 (conclusão + pagamento manual — regra de negócio), 2.6 (cancelamento — estado), 2.8 (histórico — tela densa)
**🟣 Rudney** (4): 2.3 (agenda do dia — tela densa também), 2.5 (no-show), 2.7 (remarcação — lógica de conflito de horário), 2.9 (anexos em agendamento)

**Balanceamento:** 4 fatias cada, complexidade parecida.

**Alternância de stack:** 🔵 Leandro pega fatias com regra de negócio no back (2.4, 2.6) e frontend denso (2.8). 🟣 Rudney pega tela densa (2.3) e lógica de horário (2.7). Ninguém especializa.

**Sequência sugerida:**
1. 🔵 Leandro faz 2.1 primeiro (🟣 Rudney descansa ou finaliza Bloco 1).
2. Assim que 2.1 sai, os dois fazem 2.2 em par.
3. Depois de 2.2 mergeada, 2.3-2.9 caem no backlog. Cada um puxa da sua lista, em qualquer ordem.

## Decisões pendentes deste bloco

- [ ] **Ambig #1** (2.4): permitir marcar conclusão em data futura? Recomendação atual: bloquear. Decidir antes de 2.4.
- [ ] **Ambig #2** (2.7): override de janela ao remarcar — bloquear, permitir com aviso, ou permitir silenciosamente? Recomendação atual: permitir com aviso.
- [ ] **Ambig #4** (2.5): marcar no-show antes da tolerância expirar? Fluxos divergem (10 diz "proibido", 06 diz "decidir"). Recomendação: alinhar com 10 (proibir).
- [ ] **Ambig #5** (2.6): cancelamento de agendamento passado pelo salão — como interage com faturamento? Rebate no período atual ou reabre?
- [ ] Cliente com múltiplos agendamentos simultâneos permitido? Provavelmente sim; confirmar em 2.2.

## Conflitos previstos e mitigação

- **`AgendamentoService`** vira ponto quente: 2.4, 2.5, 2.6, 2.7 vão querer adicionar métodos (`concluir`, `marcarNoShow`, `cancelar`, `remarcar`). **Mitigação:** cada método em arquivo/service separado desde 2.2 (`AgendamentoConclusaoService`, etc.). Se preferirem manter tudo no `AgendamentoService`, coordenar verbalmente ("tô mexendo hoje").
- **`AgendamentoController`**: mesma coisa — cada endpoint pode virar arquivo separado (`agendamento-conclusao.controller.ts`) ou coordenação verbal.
- Todas as outras fatias tocam entidades/telas diferentes, conflito não esperado.

## Notas

- **2.1** entrega `cliente` inteiro (entity já criada em 0.4 sem service). 🔵 Leandro adiciona service + controller + tela.
- **2.2 par obrigatório**: sugestão é 1 dia intensivo, tudo modelado, entity + service + controller + tela + teste manual seguindo `fluxos/salao/05-agendamento-manual.md`. Se der 2 dias, tudo bem, mas evita fatiar por camada.
