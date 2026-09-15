# Bloco 3 — Operação do agendamento no painel

**Dono único: 🟣 Rudney.** Feature vertical completa: o ciclo de vida do
agendamento visto e operado pelo salão.

Roda **em paralelo** com o [Bloco 4](./bloco-4-cliente-final.md). Os dois
dependem apenas do motor ([2.2b](./bloco-2-motor.md#22b-motor-de-agendamento),
já mergeado) e não dependem um do outro.

## Por que este bloco existe assim

No plano anterior, as ações do ciclo de vida estavam espalhadas (2.3, 2.5 e 2.7
com um dev; 2.4 e 2.6 com o outro) e o próprio documento já reconhecia que
`AgendamentoService` viraria "ponto quente" com quatro fatias de dois donos
disputando o mesmo arquivo. Além disso, todas as ações vivem na **mesma tela**
(o card e o detalhe do agendamento): dividir entre dois devs significava dois
PRs no mesmo componente e nenhum dos dois conseguindo testar a tela inteira.

Juntando num dono só: um PR por ação, uma tela evoluindo linearmente, e o fluxo
operacional do dia inteiro testável de ponta a ponta sem esperar ninguém.

## Entregável do bloco

Ao final, um salão consegue conduzir o dia inteiro pelo painel:

- Abrir o painel e ver a agenda do dia; navegar entre dias.
- Abrir o detalhe de um agendamento e ver as ações permitidas pelo estado.
- Concluir atendimento registrando o pagamento manual do restante.
- Marcar no-show e cancelar.
- Remarcar um agendamento.

**Fora deste bloco:** notificar a cliente ([Bloco 6](./bloco-6-notificacoes.md)),
reembolso automático ([Bloco 9](./bloco-9-pagamento-online.md)), lembrete
automático ao concluir ([Bloco 5](./bloco-5-ficha-cliente.md)), anexos
([Bloco 8](./bloco-8-anexos-agendamento.md)). Cada transição já grava
`evento_agendamento`, que é o que esses blocos consomem depois.

## Estado do schema

Todas as tabelas, enums e schemas Zod deste bloco **já existem** em
`shared/schema/src/` desde [0.4](./bloco-0-fundacao.md): `agendamento`,
`evento_agendamento` (com `TIPO_EVENTO_AGENDAMENTO`), `cobranca_manual` (com
`METODO_PAGAMENTO_MANUAL`), `pagamento_agendamento`. Nenhuma fatia aqui cria
tabela — o que entra é schema Zod de request/response, módulo Nest e tela.

---

## Fatias

### 3.1 Agenda do dia e detalhe do agendamento

- [ ] Home do painel com os agendamentos do dia e o detalhe de cada um, com a área de ações contextuais por estado. — **🟣 Rudney** — [DEP: 2.2b](./bloco-2-motor.md#22b-motor-de-agendamento) `[SEED-OK]`

**O que deve existir**

*Backend*

- Listagem dos agendamentos de um dia do salão, ordenada por horário crescente e **sem paginação** (o dia inteiro em uma resposta — regra explícita do fluxo 06).
- A resposta carrega tudo que o card precisa: horário de início, duração congelada, cliente (nome + id, para o link da ficha), procedimento, estado, preço total congelado, sinal pago, valor pendente, indicador de imagens de referência e indicador de observações.
- `valor_pendente` = preço total congelado − soma dos pagamentos confirmados.
- Agendamentos em `reservado` entram na listagem (o estado só passa a ser produzido no [Bloco 9](./bloco-9-pagamento-online.md), mas a listagem já o contempla).
- Detalhe de um agendamento: dados completos + quais ações o estado atual permite, incluindo se `inicio_em` já passou (libera no-show) e se a tolerância já expirou (define se o no-show sai com ou sem aviso).
- O "dia" é resolvido no fuso de `salao.fuso_horario`; a faixa UTC consultada deriva dele, nunca do fuso do servidor ou do dispositivo.
- Filtro por `salao_id` em toda query.

*Frontend*

- Página de agenda como home do painel autenticado, exibindo **hoje** por padrão.
- Card por agendamento com todos os campos acima.
- Navegação entre dias (anterior/próximo + seletor de data).
- Detalhe do agendamento com a área de ações contextuais — **vazia nesta fatia**; 3.2 a 3.4 a preenchem.
- Regra de ações por estado, já aplicada na UI: `reservado` só visualizar; `agendado` habilita as quatro ações; `concluido`/`cancelado`/`falta` só visualizar.
- Estado vazio ("Sem agendamentos hoje").
- Todo horário renderizado no fuso do salão, independente do fuso do dispositivo, via o pipe único previsto no [CLAUDE.md](../../CLAUDE.md).
- Link do card para a ficha da cliente — o destino final é do [Bloco 5](./bloco-5-ficha-cliente.md); até lá aponta para a tela mínima de [2.1](./bloco-2-motor.md#21-clientes).

*Shared schema*

- Schemas Zod de query (dia) e de resposta (card e detalhe) em `agendamento.schema.ts`.

**Fora desta fatia**

- Qualquer mudança de estado (3.2 a 3.4).
- Tempo real e destaque de "reserva expirando em breve" — [Bloco 6](./bloco-6-notificacoes.md) e [Bloco 9](./bloco-9-pagamento-online.md).
- Os **indicadores de imagens e de observações existem na resposta e no card, mas sempre vêm falsos** — as entidades que os alimentam chegam no [Bloco 8](./bloco-8-anexos-agendamento.md) (`anexo_agendamento`) e no [Bloco 5](./bloco-5-ficha-cliente.md) (`nota`). Sair com o campo desde já evita mexer no contrato depois.
- **Visão semanal — fora do MVP** (decidido). A agenda nasce só diária, mobile-first.

**Decisões que precisam estar fechadas antes**

- **Ambig #6** — comportamento offline: bufferizar ações ou bloquear? Recomendação: bloquear e avisar. *(única em aberto nesta fatia)*

**Critério de conclusão**

`flows/salao/06-agenda-dia.md` executável na parte de visualização: abrir o
painel e cair em hoje, navegar entre dias, abrir o detalhe, ver o estado vazio,
e conferir que um agendamento criado via API aparece no horário correto do fuso
do salão com um dispositivo em outro fuso.

**Tamanho estimado:** ~55-65 arquivos.

---

### 3.2 Conclusão de atendimento e pagamento manual

- [ ] Transição `agendado` → `concluido` com registro obrigatório do pagamento do restante. — **🟣 Rudney** — [DEP: 3.1](#31-agenda-do-dia-e-detalhe-do-agendamento)

**Esta é a fatia que fixa o padrão de transição do bloco** (ver [Camada de
transição](#camada-de-transição) nas notas). 3.3 e 3.4 seguem o mesmo formato.

**O que deve existir**

*Backend*

- `AgendamentoConclusaoService`: transição `agendado` → `concluido`, gravando `evento_agendamento` com `tipo = concluido` e `ocorreu_em`.
- Módulo de pagamento manual sobre as tabelas existentes: cria `cobranca_manual` (valor + `metodo_pagamento_manual` + quem registrou) e amarra ao agendamento via `pagamento_agendamento`.
- **Registro do pagamento é obrigatório ao concluir** — ou um método, ou a marcação explícita "não recebeu valor pendente". Regra do fluxo 07: força consciência.
- Quando `valor_pendente = 0` (cliente já pagou tudo), a conclusão não exige método.
- Bloqueio quando o estado não é `agendado`; segunda tentativa retorna erro claro de estado terminal (race do fluxo 06).
- Conclusão aceita data posterior ao atendimento ("salão esqueceu de marcar no dia") — a data que vale para faturamento é a do `evento_agendamento`, não a de `inicio_em`.
- **Concluir agendamento cuja data ainda não chegou é permitido, com aviso explícito** (ambig #1, decidida). O aviso precisa deixar claro que o atendimento entra no faturamento do período atual.

*Frontend*

- Ação "Concluir atendimento" no detalhe, visível só em `agendado`.
- Modal de conclusão com: valor total, sinal já pago e seu método, **valor pendente em destaque**, seletor de método do restante e opção "Não recebeu valor pendente" com aviso.
- Variação sem seletor quando o pendente é zero (só confirmação).
- Card sai da agenda ativa após concluir.

*Shared schema*

- Schemas Zod de request (método ou "não recebeu") e de resposta em `cobranca_manual.schema.ts` / `pagamento_agendamento.schema.ts`.

**Fora desta fatia**

- Lembrete automático de manutenção ao concluir → [5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes).
- Anexos internos do resultado → [8.1](./bloco-8-anexos-agendamento.md#81-módulo-de-anexos-e-anexos-internos-do-salão).
- Cobrança online do restante → [9.4](./bloco-9-pagamento-online.md#94-cobranças-online-pelo-painel).
- Fora do MVP, confirmado nos fluxos: múltiplos pagamentos parciais do restante, editar o procedimento ao concluir, reverter conclusão, conclusão em lote, recibo digital.

**Critério de conclusão**

`flows/salao/07-conclusao-atendimento.md` ponta a ponta nas três variações:
pagou só sinal (pede método), pagou total (só confirma), e "não recebeu" (grava
com aviso). Mais a conclusão antecipada, conferindo que o aviso aparece e que o
`evento_agendamento` foi gravado com a data real da conclusão.

**Tamanho estimado:** ~65-75 arquivos.

---

### 3.3 Encerramentos sem atendimento: no-show e cancelamento

- [ ] Transições `agendado` → `falta` e `agendado` → `cancelado` pelo salão. — **🟣 Rudney** — [DEP: 3.2](#32-conclusão-de-atendimento-e-pagamento-manual) `[BLOQ:gateway — reembolso automático fica para 9.3]`

**Por que as duas juntas:** são a mesma mecânica (transição terminal +
confirmação + `evento_agendamento` + liberação do slot) sobre o padrão que a
3.2 já estabeleceu. Separadas, cada uma seria um PR pequeno demais; juntas,
uma fatia de tamanho normal que fecha os dois fluxos de uma vez.

**O que deve existir**

*Backend — no-show*

- `AgendamentoNoShowService`: transição para `falta`, gravando `evento_agendamento` com `tipo = falta`.
- Depois de `inicio_em + configuracao_salao.tolerancia_atraso_min`, a marcação é livre.
- **Antes de a tolerância expirar, a marcação é permitida com aviso** de que o prazo ainda não passou (ambig #4, decidida — reverte a proibição que estava no fluxo 10).
- **Antes de `inicio_em`, continua bloqueado**: marcar falta em atendimento que ainda nem começou não é atraso, é erro. Essa parte da regra do fluxo 10 não foi alterada.
- Marcação é sempre manual — o sistema nunca marca sozinho (evita falso positivo).
- Sinal é retido em qualquer no-show, independente de motivo. Agendamento sem sinal registra o no-show sem valor retido.

*Backend — cancelamento pelo salão*

- `AgendamentoCancelamentoService`: transição para `cancelado`, gravando `evento_agendamento` com `tipo = cancelado`, liberando o slot imediatamente.
- Motivo opcional, texto livre, **de registro interno — nunca exibido para a cliente**.
- Cancelar agendamento em `reservado` descarta a reserva (sem sinal envolvido).
- Cancelamento de agendamento passado é permitido, como correção de registro.
- **Esta é a transição que o [Bloco 4](./bloco-4-cliente-final.md) reusa** para o cancelamento pela cliente, com política de autorização diferente. Ela nasce aqui como service público.

*Backend — comum*

- Estados terminais bloqueiam ambas as ações; race entre duas ações concorrentes resolve por "primeiro no servidor vence", com erro claro para o segundo.

*Frontend*

- Ação "Marcar no-show" no detalhe, habilitada a partir de `inicio_em`, com confirmação exibindo o valor do sinal a ser retido e o nome da cliente — **e um aviso adicional quando a tolerância ainda não expirou**.
- Ação "Cancelar" no detalhe, com modal de motivo opcional e aviso de que a cliente será notificada.
- Ambos os cards saem da agenda ativa.

**Fora desta fatia**

- Reembolso do sinal → [9.3](./bloco-9-pagamento-online.md#93-reembolso-no-cancelamento). Nesta fatia o sinal sempre fica retido, e a escolha "reembolsar vs. reter" ainda não existe na UI.
- Notificação à cliente e `.ics` de cancelamento → [6.2](./bloco-6-notificacoes.md#62-calendário-ics-e-avisos-de-alteração). O aviso "cliente será notificada" descreve o comportamento final; até o Bloco 6, nada é enviado.
- Fora do MVP, confirmado nos fluxos: reversão de no-show, cancelamento em massa, bloqueio de cliente com N no-shows.

**Decisões que precisam estar fechadas antes**

- **Ambig #5** — cancelamento de agendamento passado rebate no período atual do faturamento ou reabre o período? Precisa estar fechado antes do [Bloco 7](./bloco-7-faturamento.md).

**Critério de conclusão**

`flows/salao/10-no-show.md` e `flows/salao/08-cancelamento.md` ponta a ponta,
incluindo: aviso ao marcar no-show antes da tolerância, sinal exibido na
confirmação, motivo gravado e não exposto, slot liberado na hora (conferir que
o horário volta a aparecer nos horários livres do motor).

**Tamanho estimado:** ~55-65 arquivos.

---

### 3.4 Remarcação

- [ ] Mover um agendamento para outra data/hora, mantendo o mesmo registro. — **🟣 Rudney** — [DEP: 3.3](#33-encerramentos-sem-atendimento-no-show-e-cancelamento)

**O que deve existir**

*Backend*

- `AgendamentoRemarcacaoService`: atualiza `inicio_em` **no mesmo agendamento** — mesmo `id`, nunca um registro novo (é o que faz o `.ics` de update funcionar no [Bloco 6](./bloco-6-notificacoes.md)).
- Grava `evento_agendamento` com `tipo = remarcado` a cada remarcação. A contagem desses eventos é o `SEQUENCE` do `.ics` e o "remarcado N vezes" do histórico.
- Reusa o cálculo de disponibilidade do motor ([2.2b](./bloco-2-motor.md#22b-motor-de-agendamento)) para oferecer os horários válidos, considerando a **duração congelada do agendamento**, não a duração atual do catálogo.
- Revalida no momento de confirmar: slot livre, dentro de janela, sem conflito. Slot alvo com `reservado` pendente bloqueia.
- Libera o slot antigo e ocupa o novo imediatamente.
- Preserva cliente, procedimento, duração, preço total, sinal pago, valor pendente.
- Remarcar para o passado é bloqueado. Remarcar para o mesmo horário é no-op ou erro de validação.
- **Encaixe fora da janela é permitido, com aviso** (ambig #2, decidida) — vale igual aqui e no agendamento manual ([2.2a](./bloco-2-motor.md#22a-tela-de-agendamento-manual)).
- Data com override "fechado" **continua bloqueando** — é diferente de furar a janela: ali o salão decidiu conscientemente não atender.

*Frontend*

- Ação "Remarcar" no detalhe, em `agendado`.
- Seletor de nova data/hora alimentado pela disponibilidade real, no formato já usado na tela de agendamento manual ([2.2a](./bloco-2-motor.md#22a-tela-de-agendamento-manual)) — reaproveitar o componente, não duplicar.
- Confirmação explícita "de [antigo] para [novo]; a cliente será notificada".
- Histórico de remarcações visível no detalhe do agendamento ("remarcado N vezes"), recomendado pelo fluxo 09.

**Fora desta fatia**

- `.ics` de update e push para a cliente → [6.2](./bloco-6-notificacoes.md#62-calendário-ics-e-avisos-de-alteração).
- Fora do MVP, confirmado nos fluxos: remarcar trocando de procedimento, remarcação em massa, cliente aceitar/recusar a remarcação, cliente remarcar sozinha.

**Critério de conclusão**

`flows/salao/09-remarcacao.md` ponta a ponta: remarcar, conferir que o `id` não
mudou, que o slot antigo voltou a aparecer nos horários livres, que o novo está
ocupado, que sinal e valores foram preservados, e que uma segunda remarcação
incrementa a contagem de eventos `remarcado`.

**Tamanho estimado:** ~50-60 arquivos.

---

## Dependências

**Entra sem esperar ninguém.** Depende só de:

- [2.2b](./bloco-2-motor.md#22b-motor-de-agendamento) — motor (mergeado).
- [1.4-BE](./bloco-1-setup-salao.md#14-be-disponibilidade) e [1.5-BE](./bloco-1-setup-salao.md#15-be-configuracao-do-salao) — janelas e configuração (mergeadas).

Os cards exibem nome de cliente. Enquanto [2.1](./bloco-2-motor.md#21-clientes)
não estiver mergeada, usar cliente seed — é leitura direta da tabela `cliente`,
que existe desde 0.4. Não bloqueia.

**Este bloco destrava:** [Bloco 5](./bloco-5-ficha-cliente.md),
[Bloco 6](./bloco-6-notificacoes.md), [Bloco 7](./bloco-7-faturamento.md),
[8.1](./bloco-8-anexos-agendamento.md#81-módulo-de-anexos-e-anexos-internos-do-salão)
e a fatia de cancelamento pela cliente do
[Bloco 4](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento).

## Sequência

3.1 → 3.2 → 3.3 → 3.4. Estritamente nessa ordem: 3.1 cria a tela onde as ações
moram e 3.2 fixa o padrão de transição que as outras seguem.

## Notas

### Camada de transição

Todas as transições deste bloco são API pública para os blocos 4, 5, 6 e 7.
Convenção: **um service por transição** (`AgendamentoConclusaoService`,
`AgendamentoNoShowService`, `AgendamentoCancelamentoService`,
`AgendamentoRemarcacaoService`), cada um gravando o `evento_agendamento`
correspondente. `AgendamentoService` continua responsável por criação e consulta.

Motivo: o Bloco 4 reusa `cancelar()` e o Bloco 6 se pendura nos eventos.
Service por transição evita que blocos diferentes precisem abrir o mesmo arquivo.

### Tempo real

A agenda pede atualização em tempo real, mas a **origem** desses eventos é o
Bloco 4 (cliente cria e cancela) e o **transporte** é o Bloco 6. Aqui a agenda
recarrega sob demanda (troca de dia / pull-to-refresh). O Bloco 6 acopla o
transporte depois, sem redesenhar a tela.
