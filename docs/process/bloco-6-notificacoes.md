# Bloco 6 — Notificações e tempo real

**Dono único: 🔵 Leandro.** Feature vertical completa: os canais do MVP para
comunicação de evento — aviso in-app persistente, `.ics` e atualização em
tempo real do painel. Push PWA fica como incremento futuro.

Roda **em paralelo** com o [Bloco 5](./bloco-5-ficha-cliente.md).

## Por que este bloco existe assim

Notificação é transversal por natureza: toca a superfície da cliente (`.ics`,
aviso in-app) e a do salão (novo agendamento, cancelamento pela
cliente, lembrete do dia). No plano anterior aparecia espremida como uma fatia
só (4.5), com a própria nota admitindo que "pode ser bem grande".

Tratada como bloco próprio e com dono único, a infra nasce uma vez e todos os
eventos se penduram nela. Cai para o dono do
[Bloco 4](./bloco-4-cliente-final.md), que já construiu a superfície pública da
cliente onde os avisos serão exibidos.

## Entregável do bloco

Ao final:

- A cliente vê um aviso in-app persistente quando o salão remarca ou cancela,
  até reconhecer.
- A cliente adiciona o agendamento ao calendário nativo; remarcação vira update e cancelamento vira cancel **no mesmo evento**.
- O painel recebe em tempo real: novo agendamento e cancelamento pela cliente.
- O salão é notificado dos lembretes no dia alvo.

## Natureza do bloco

Este é um bloco de **acoplamento**: ele não pede mudança de regra nas features
existentes, se pendura nos `evento_agendamento` que os blocos 3 e 4 já gravam.
Por isso entra depois dos dois — e por isso não bloqueia ninguém enquanto
espera.

---

## Fatias

### 6.1 Canal de notificação

- [x] Infra de entrega: avisos in-app persistentes para cliente e salão, sem nenhum evento de negócio ligado ainda. — **🔵 Leandro** — [DEP: 4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente) `[DECIDIDO: in-app + .ics no MVP; push PWA fica para incremento futuro]`

**O que deve existir**

_Backend_

- Armazenamento dos avisos in-app com estado **não reconhecido / reconhecido**, separado por salão e destinatário.
- Listagem paginada dos avisos pendentes para a cliente identificada e para o usuário autenticado do salão.
- Reconhecimento idempotente do aviso, sem permitir acesso entre salões ou destinatários.
- Serviços internos para criar avisos destinados à cliente ou ao usuário do salão; os eventos de negócio serão ligados nas fatias seguintes.

_Frontend_

- Central de avisos reutilizável na página pública da cliente identificada e no painel autenticado do salão.
- Contador de avisos pendentes, paginação e ação para marcar cada aviso como visto.
- Estado vazio, carregamento e erro com nova tentativa.

**Fora desta fatia**

- Qualquer evento de negócio disparando notificação — isso é 6.2 e 6.3. Esta fatia entrega apenas o canal persistente.
- Push PWA, assinatura por dispositivo, chaves VAPID e tratamento específico do Safari iOS — incremento posterior ao MVP.

**Decisão fechada**

- **Canal do MVP** (ambig #13, #14): `.ics` + aviso in-app. Push PWA fica como incremento futuro para reduzir o risco técnico do MVP.

**Critério de conclusão**

Criar avisos para cliente e salão, vê-los persistir entre recarregamentos e
sumir da lista de pendentes ao serem reconhecidos. Confirmar que outro salão
ou destinatário não consegue listar nem reconhecer o aviso.

**Tamanho realizado:** schema compartilhado, migration, módulo backend,
central reutilizável no frontend e testes de isolamento/idempotência.

---

### 6.2 Calendário (.ics) e avisos de alteração

- [x] Geração de `.ics` nos três momentos + o fluxo completo de "o salão alterou seu agendamento" para a cliente. — **🔵 Leandro** — [DEP: 6.1](#61-canal-de-notificação) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) · [DEP: 3.4](./bloco-3-painel-operacao.md#34-remarcação)

**Por que juntas:** o `.ics` de update e o `.ics` de cancel só existem dentro do
fluxo `05-notificacao-alteracao.md` — são o botão "Atualizar calendário" do
aviso. Separar o gerador do fluxo que o usa daria duas fatias pequenas e uma
delas sem nada testável na tela.

**O que deve existir**

_Backend_

- Geração de `.ics` de convite no ato da confirmação do agendamento.
- **Notificação de novo agendamento para a cliente quando o salão cria manualmente** ([2.2c](./bloco-2-motor.md#22c-integrar-fluxo-manual)): o fluxo 05 exige que ela receba _a mesma_ notificação que receberia no fluxo digital, com `.ics` de convite. É o gancho que faltava entre o agendamento manual e este bloco.
- `.ics` de update (`METHOD:REQUEST`) quando o salão remarca, e de cancelamento (`METHOD:CANCEL`) quando cancela.
- **UID derivado de `agendamento.id` e imutável ao longo das remarcações** — é o que faz o calendário nativo tratar como update e não como evento novo.
- `SEQUENCE` = contagem de `evento_agendamento` com `tipo = remarcado` daquele agendamento (já gravados por [3.4](./bloco-3-painel-operacao.md#34-remarcação)).
- Ganchos nos services de cancelamento e remarcação de [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) e [3.4](./bloco-3-painel-operacao.md#34-remarcação): cada um cria o aviso in-app persistente.
- Múltiplas alterações no mesmo agendamento geram `SEQUENCE` crescente; a última prevalece.

_Frontend_

- Botão "Adicionar ao calendário" na confirmação do agendamento ([4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)).
- Aviso in-app na lista de agendamentos da cliente quando houve alteração, com o resumo "de [antigo] → [novo]".
- Botões "Atualizar calendário" (remarcação) e "Remover do calendário" (cancelamento), baixando o `.ics` correspondente.
- Reconhecer o aviso o faz sumir.
- Cliente que nunca adicionou ao calendário consegue dispensar o aviso direto, sem passar pelo `.ics`.

**Fora desta fatia**

- Notificações na direção do salão → 6.3.
- Fora do MVP, confirmado nos fluxos: cliente aceitar ou recusar a remarcação, reenviar push perto da data, email como canal.

**Decisões fechadas**

- O aviso abre o detalhe do agendamento dentro de **Meus agendamentos** no próprio portal público `/s/:subdominio`.
- No MVP, todo agendamento criado manualmente pelo salão avisa a cliente. Não há opção "não avisar" na tela.

**Critério de conclusão**

Criar um agendamento manual pelo painel e ver a cliente receber a notificação
com o convite de calendário. Mais `flows/cliente/05-notificacao-alteracao.md`
ponta a ponta nos dois caminhos:
remarcar pelo painel e ver a cliente receber o aviso, atualizar o calendário
nativo e o evento **mudar de horário em vez de duplicar**; cancelar pelo painel
e ver o evento sair do calendário. Mais duas remarcações seguidas, conferindo
que o `SEQUENCE` incrementa.

**Tamanho realizado:** gerador `.ics`, endpoint público autorizado, avisos
persistentes nos fluxos de criação manual, remarcação e cancelamento, ações de
calendário na central e na confirmação, navegação para o detalhe e testes dos
três estados do evento.

---

### 6.3 Tempo real no painel

- [x] Eventos chegando ao painel sem recarregar: novo agendamento, cancelamento pela cliente e lembrete do dia. — **🔵 Leandro** — [DEP: 6.1](#61-canal-de-notificação) · [DEP: 4.3](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento) · [DEP: 3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento) · [DEP: 5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes)

**O que deve existir**

_Backend_

- Transporte de eventos para o painel (websocket ou polling curto — ver decisão), escopado por salão.
- Eventos publicados: novo agendamento criado pela cliente ([4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)) e cancelamento pela cliente ([4.3](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento)).
- Notificação in-app ao salão no `data_alvo` de cada lembrete ativo ([5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes)). `data_alvo` no passado notifica imediatamente.

_Frontend_

- Agenda do dia ([3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)) reflete os eventos sem recarregar: card novo aparece, card cancelado muda de estado.
- Múltiplos dispositivos do salão abertos simultaneamente convergem para o mesmo estado.
- Notificação de lembrete no painel.

**Fora desta fatia**

- Destaque de "reserva expirando em breve" — depende do estado `reservado`, que só passa a existir em [9.1](./bloco-9-pagamento-online.md#91-módulo-de-pagamento-e-estado-reservado).
- Fora do MVP: bufferizar ações offline (ver ambig #6, decidida no [Bloco 3](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)).

**Decisão fechada**

- **Estratégia de tempo real** (ambig #13): polling a cada 15 segundos na agenda e nas centrais de avisos do salão e da cliente. Os lembretes vencidos são processados no início da API, após criação/alteração e a cada minuto.

**Critério de conclusão**

Com o painel aberto em dois dispositivos: criar um agendamento pelo fluxo da
cliente e ver o card aparecer nos dois; cancelar pela cliente e ver os dois
atualizarem. Criar um lembrete com data alvo hoje e receber a notificação.

**Tamanho realizado:** avisos para eventos públicos de agendamento, processamento
idempotente dos lembretes por data civil do salão, polling da agenda e da
central, migration e testes dos novos fluxos.

---

## Dependências

Depende dos blocos 3, 4 e 5 — **todos já mergeados** quando este bloco abre.

Ordem de abertura: entra depois que o [Bloco 3](./bloco-3-painel-operacao.md) e
o [Bloco 4](./bloco-4-cliente-final.md) estiverem fechados. Se o
[Bloco 5](./bloco-5-ficha-cliente.md) ainda estiver em curso, fazer 6.1 → 6.2 e
deixar a parte de lembrete da 6.3 por último.

## Sequência

6.1 → 6.2 → 6.3.

A parte de `.ics` da 6.2 complementa o canal in-app sem depender de permissões
do dispositivo.

## Notas

- Push em PWA no iOS tem limitações reais e, por decisão do MVP, será tratado apenas como incremento futuro. `.ics` + in-app cobrem o fluxo crítico atual.
- Um caso que os fluxos assumem e o sistema não protege: a cliente não vê a notificação e aparece no horário antigo. Tratamento é pessoal, pelo salão.
