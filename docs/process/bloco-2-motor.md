# Bloco 2 — Motor de agendamento e agendamento manual

O coração do produto. Ao final deste bloco o salão consegue marcar um horário
pelo painel, ponta a ponta.

> **Nota de reorganização.** Este bloco era originalmente maior (ia de 2.1 até
> 2.9, com agenda do dia, conclusão, cancelamento, remarcação, no-show,
> histórico e anexos). As fatias de 2.3 em diante foram redistribuídas em
> blocos verticais com dono único — ver [README](./README.md#reorganização-a-partir-do-bloco-3).
> O que continua aqui é o escopo já combinado e em andamento.

## Entregável do bloco

Ao final, um salão consegue:

- Cadastrar clientes (CRUD básico ou inline no agendamento).
- Consultar horários livres de um procedimento em um dia.
- Criar agendamento manual pelo painel, com validação de conflito.

**Fora deste bloco:** operar o dia (agenda, conclusão, cancelamento,
remarcação, no-show) — isso é o [Bloco 3](./bloco-3-painel-operacao.md).
Pagamento online continua no [Bloco 9](./bloco-9-pagamento-online.md).

## Fatias

### 2.1 Clientes

- [ ] `cliente` entity + CRUD backend + tela mínima de listagem — **🔵 Leandro** — [DEP: 1.1](./bloco-1-setup-salao.md#11-onboarding)

**Prioridade máxima:** é a única fatia deste bloco que outra pessoa espera. O
[Bloco 4](./bloco-4-cliente-final.md) precisa de `ClienteService` para
identificar a cliente pelo WhatsApp. Puxar esta antes de 2.2a.

### 2.1b Extrair cliente do motor de agendamento

- [ ] Após criar `ClienteModule`, mover a validação temporária de cliente ativo do `AgendamentoService` para `ClienteService`. — **🔵 Leandro** — [DEP: 2.1](#21-clientes) · [DEP: 2.2b](#22b-motor-de-agendamento)

### 2.2a Tela de agendamento manual

- [ ] Tela do painel: buscar/criar cliente, selecionar procedimento, escolher horário e tratar conflitos. Trabalha contra o contrato da API com mock local até a integração. — **🔵 Leandro** — [DEP: 2.1](#21-clientes) · [DEP: 1.3-FE](./bloco-1-setup-salao.md#13-fe-tela-de-procedimentos) `[SEED-OK]`

### 2.2b Motor de agendamento

- [x] API de horários livres e criação transacional: compõe janelas + overrides + duração, revalida o slot, aloca profissional e cria direto em `agendado` com duração/preços congelados. Testa com cliente seed, sem depender do CRUD 2.1. — **🟣 Rudney** — [DEP: 1.3-BE](./bloco-1-setup-salao.md#13-be-procedimentos) · [DEP: 1.4-BE](./bloco-1-setup-salao.md#14-be-disponibilidade) `[SEED-OK]` `[BLOQ:pagamento-sinal-desabilitado — sinal e gateway ficam para o Bloco 9]`

### 2.2c Integrar fluxo manual

- [ ] Trocar o mock pela API real e validar o fluxo ponta a ponta. O frontend consome os contratos já publicados pelo motor; alterações em schema, controller, service, repository ou regra de disponibilidade exigem uma nova fase de backend, com revisão específica. — **🔵 Leandro** — [DEP: 2.2a](#22a-tela-de-agendamento-manual) · [DEP: 2.2b](#22b-motor-de-agendamento)

**Critério de conclusão:** a tela usa os endpoints de horários livres, avaliação
e criação; apresenta bloqueios e exige confirmação para avisos; e o fluxo manual
é validado ponta a ponta contra a API real.

**Mudança em relação ao plano anterior:** 2.2c era "livre (quem terminar
primeiro)". Passa a ser do 🔵 Leandro, dono da tela em 2.2a. Integração não é
uma tarefa própria — é o fechamento da feature na mão de quem a construiu.
Deixar livre criava um handoff no meio de uma feature, exatamente o que a
reorganização quer eliminar.

## Divisão e por quê

Este bloco mantém a divisão já combinada: 🟣 Rudney entregou o motor (2.2b);
🔵 Leandro entrega clientes e a tela manual (2.1, 2.1b, 2.2a, 2.2c).

O 🟣 Rudney **não espera** o fechamento deste bloco: assim que 2.2b está
mergeada, ele abre o [Bloco 3](./bloco-3-painel-operacao.md), que depende só do
motor. Os dois blocos correm em paralelo.

**Sequência:**

1. 🔵 Leandro: 2.1 → 2.1b → 2.2a → 2.2c.
2. 🟣 Rudney: já em 2.2b; ao mergear, segue direto para o Bloco 3.
3. Quando 🔵 Leandro fecha 2.2c, abre o [Bloco 4](./bloco-4-cliente-final.md).

## Decisões pendentes deste bloco

- [ ] Cliente com múltiplos agendamentos simultâneos permitido? Provavelmente sim; confirmar.
- [x] **Override de janela ao criar agendamento manual** (encaixe fora do horário): decidido — **permitir com aviso**. Mesma regra na remarcação ([3.4](./bloco-3-painel-operacao.md#34-remarcação)). Data com override "fechado" continua bloqueando.
- [ ] "Não avisar a cliente" no agendamento manual entra no MVP? (ambig #7). Só faz sentido depois do [Bloco 6](./bloco-6-notificacoes.md); MVP deste bloco não notifica ninguém.

## Conflitos previstos e mitigação

- `AgendamentoService` vira ponto quente a partir do Bloco 3 (conclusão, cancelamento, remarcação, no-show). Mitigação estrutural: **o Bloco 3 tem dono único**, então o ponto quente deixa de ser compartilhado. 🔵 Leandro só lê o motor em 2.2c; se precisar mudá-lo, abre uma fase de backend com o 🟣 Rudney.
- 2.1b toca `AgendamentoService` para remover a validação temporária de cliente. É uma extração pequena; combinar verbalmente com o 🟣 Rudney antes de puxar, já que ele estará com o arquivo aberto no Bloco 3.

## Notas

- **2.1** entrega `cliente` inteiro (entity já criada em 0.4 sem service). 🔵 Leandro adiciona service + controller + tela mínima. A lista completa (busca, filtros, métricas) e a ficha ficam no [Bloco 5](./bloco-5-ficha-cliente.md).
- **Fluxo de referência de 2.2a e 2.2c:** `flows/salao/05-agendamento-manual.md`. O ponteiro estava faltando — sem ele o planejamento da fatia não sabe qual doc é canônico para as regras da tela.
- **2.2a–2.2c**: três PRs curtos — tela com mock, motor com seed e integração final. O contrato HTTP já está publicado pelo motor.
