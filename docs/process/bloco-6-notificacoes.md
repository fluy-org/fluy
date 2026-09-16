# Bloco 6 — Notificações e tempo real

**Dono único: 🔵 Leandro.** Feature vertical completa: todo canal de
comunicação de evento — push PWA, aviso in-app persistente, `.ics` e
atualização em tempo real do painel.

Roda **em paralelo** com o [Bloco 5](./bloco-5-ficha-cliente.md).

## Por que este bloco existe assim

Notificação é transversal por natureza: toca a superfície da cliente (push,
`.ics`, aviso in-app) e a do salão (novo agendamento, cancelamento pela
cliente, lembrete do dia). No plano anterior aparecia espremida como uma fatia
só (4.5), com a própria nota admitindo que "pode ser bem grande".

Tratada como bloco próprio e com dono único, a infra nasce uma vez e todos os
eventos se penduram nela. Cai para o dono do
[Bloco 4](./bloco-4-cliente-final.md) porque a parte mais cara é o PWA da
cliente (service worker, permissão, Safari iOS) — superfície que ele construiu.

## Entregável do bloco

Ao final:

- A cliente recebe push quando o salão remarca ou cancela.
- A cliente sem push habilitado vê um aviso in-app persistente até reconhecer.
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

- [ ] Infra de entrega: push PWA por dispositivo + avisos in-app persistentes, sem nenhum evento de negócio ligado ainda. — **🔵 Leandro** — [DEP: 4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente) `[DECIDIR: canal do MVP — push PWA agora ou só in-app + .ics? (ambig #13, #14)]`

**O que deve existir**

*Backend*

- Registro de assinatura de push por dispositivo, tanto para a cliente (ligado à `sessao_cliente`) quanto para o usuário do salão.
- Envio de push com chaves VAPID.
- Armazenamento dos avisos in-app com estado **não reconhecido / reconhecido**, e endpoint de reconhecimento.
- Tratamento de assinatura expirada ou revogada sem quebrar o envio dos demais.

*Frontend*

- Service worker e manifest do PWA.
- Pedido de permissão de push, opcional, na tela de confirmação do agendamento.
- Componente de aviso in-app que **persiste até ser reconhecido** — é a proteção principal para quem não habilitou push.
- Suporte a Safari iOS PWA, com as limitações conhecidas assumidas (ver notas).

**Fora desta fatia**

- Qualquer evento de negócio disparando notificação — isso é 6.2 e 6.3. Esta fatia entrega o canal e é testada com um disparo manual.

**Decisões que precisam estar fechadas antes**

- **Canal do MVP** (ambig #13, #14): push PWA entra agora, ou o MVP fica em `.ics` + aviso in-app? **Bloqueia esta fatia.** Recomendação: `.ics` + in-app no MVP, push como incremento — cobre o requisito de "nenhuma parte perde uma alteração crítica" com muito menos risco.

**Critério de conclusão**

Assinar push nos dois lados (cliente e salão), disparar uma notificação de
teste e recebê-la; criar um aviso in-app, vê-lo persistir entre recarregamentos
e sumir ao ser reconhecido.

**Tamanho estimado:** ~55-65 arquivos.

---

### 6.2 Calendário (.ics) e avisos de alteração

- [ ] Geração de `.ics` nos três momentos + o fluxo completo de "o salão alterou seu agendamento" para a cliente. — **🔵 Leandro** — [DEP: 6.1](#61-canal-de-notificação) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) · [DEP: 3.4](./bloco-3-painel-operacao.md#34-remarcação) `[DECIDIR: schema do deep link (ambig #14)]`

**Por que juntas:** o `.ics` de update e o `.ics` de cancel só existem dentro do
fluxo `05-notificacao-alteracao.md` — são o botão "Atualizar calendário" do
aviso. Separar o gerador do fluxo que o usa daria duas fatias pequenas e uma
delas sem nada testável na tela.

**O que deve existir**

*Backend*

- Geração de `.ics` de convite no ato da confirmação do agendamento.
- **Notificação de novo agendamento para a cliente quando o salão cria manualmente** ([2.2c](./bloco-2-motor.md#22c-integrar-fluxo-manual)): o fluxo 05 exige que ela receba *a mesma* notificação que receberia no fluxo digital, com `.ics` de convite. É o gancho que faltava entre o agendamento manual e este bloco.
- `.ics` de update (`METHOD:REQUEST`) quando o salão remarca, e de cancelamento (`METHOD:CANCEL`) quando cancela.
- **UID derivado de `agendamento.id` e imutável ao longo das remarcações** — é o que faz o calendário nativo tratar como update e não como evento novo.
- `SEQUENCE` = contagem de `evento_agendamento` com `tipo = remarcado` daquele agendamento (já gravados por [3.4](./bloco-3-painel-operacao.md#34-remarcação)).
- Ganchos nos services de cancelamento e remarcação de [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) e [3.4](./bloco-3-painel-operacao.md#34-remarcação): cada um dispara push + cria o aviso in-app persistente.
- Múltiplas alterações no mesmo agendamento geram `SEQUENCE` crescente; a última prevalece.

*Frontend*

- Botão "Adicionar ao calendário" na confirmação do agendamento ([4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)).
- Aviso in-app na lista de agendamentos da cliente quando houve alteração, com o resumo "de [antigo] → [novo]".
- Botões "Atualizar calendário" (remarcação) e "Remover do calendário" (cancelamento), baixando o `.ics` correspondente.
- Reconhecer o aviso o faz sumir.
- Deep link do push abrindo direto no agendamento afetado.
- Cliente que nunca adicionou ao calendário consegue dispensar o aviso direto, sem passar pelo `.ics`.

**Fora desta fatia**

- Notificações na direção do salão → 6.3.
- Fora do MVP, confirmado nos fluxos: cliente aceitar ou recusar a remarcação, reenviar push perto da data, email como canal.

**Decisões que precisam estar fechadas antes**

- **Schema do deep link** (ambig #14): qual formato de URL o push usa para abrir o agendamento certo.
- **Ambig #7** — o salão pode marcar um agendamento manual como "não avisar a cliente" (encaixe já combinado ao vivo)? Se sim, é um campo na tela de [2.2a](./bloco-2-motor.md#22a-tela-de-agendamento-manual) e uma condição aqui. Os fluxos sugerem o checkbox mas ninguém confirmou se entra no MVP.

**Critério de conclusão**

Criar um agendamento manual pelo painel e ver a cliente receber a notificação
com o convite de calendário. Mais `flows/cliente/05-notificacao-alteracao.md`
ponta a ponta nos dois caminhos:
remarcar pelo painel e ver a cliente receber o aviso, atualizar o calendário
nativo e o evento **mudar de horário em vez de duplicar**; cancelar pelo painel
e ver o evento sair do calendário. Mais duas remarcações seguidas, conferindo
que o `SEQUENCE` incrementa.

**Tamanho estimado:** ~70-80 arquivos.

---

### 6.3 Tempo real no painel

- [ ] Eventos chegando ao painel sem recarregar: novo agendamento, cancelamento pela cliente e lembrete do dia. — **🔵 Leandro** — [DEP: 6.1](#61-canal-de-notificação) · [DEP: 4.3](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento) · [DEP: 3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento) · [DEP: 5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes) `[DECIDIR: websocket vs. polling curto (ambig #13)]`

**O que deve existir**

*Backend*

- Transporte de eventos para o painel (websocket ou polling curto — ver decisão), escopado por salão.
- Eventos publicados: novo agendamento criado pela cliente ([4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)) e cancelamento pela cliente ([4.3](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento)).
- Notificação in-app + push ao salão no `data_alvo` de cada lembrete ativo ([5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes)). `data_alvo` no passado notifica imediatamente.

*Frontend*

- Agenda do dia ([3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)) reflete os eventos sem recarregar: card novo aparece, card cancelado muda de estado.
- Múltiplos dispositivos do salão abertos simultaneamente convergem para o mesmo estado.
- Notificação de lembrete no painel.

**Fora desta fatia**

- Destaque de "reserva expirando em breve" — depende do estado `reservado`, que só passa a existir em [9.1](./bloco-9-pagamento-online.md#91-módulo-de-pagamento-e-estado-reservado).
- Fora do MVP: bufferizar ações offline (ver ambig #6, decidida no [Bloco 3](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)).

**Decisões que precisam estar fechadas antes**

- **Estratégia de tempo real** (ambig #13): websocket ou polling curto? Recomendação para o MVP: polling curto na agenda — resolve o caso real (salão olhando a agenda) sem infra nova.

**Critério de conclusão**

Com o painel aberto em dois dispositivos: criar um agendamento pelo fluxo da
cliente e ver o card aparecer nos dois; cancelar pela cliente e ver os dois
atualizarem. Criar um lembrete com data alvo hoje e receber a notificação.

**Tamanho estimado:** ~50-60 arquivos.

---

## Dependências

Depende dos blocos 3, 4 e 5 — **todos já mergeados** quando este bloco abre.

Ordem de abertura: entra depois que o [Bloco 3](./bloco-3-painel-operacao.md) e
o [Bloco 4](./bloco-4-cliente-final.md) estiverem fechados. Se o
[Bloco 5](./bloco-5-ficha-cliente.md) ainda estiver em curso, fazer 6.1 → 6.2 e
deixar a parte de lembrete da 6.3 por último.

## Sequência

6.1 → 6.2 → 6.3.

Se a decisão de canal atrasar, a parte de `.ics` da 6.2 é independente de push
e pode vir primeiro: entrega valor sozinha e não depende de permissão do
dispositivo.

## Notas

- **Este é o maior risco técnico do MVP.** Push em PWA no iOS tem limitações reais. Se a 6.1 passar de uma semana, cortar push e entregar `.ics` + in-app — que já cobrem o requisito do fluxo de "nenhuma parte perde uma alteração crítica".
- Um caso que os fluxos assumem e o sistema não protege: a cliente não vê a notificação e aparece no horário antigo. Tratamento é pessoal, pelo salão.
