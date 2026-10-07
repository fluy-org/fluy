# Bloco 9 — Pagamento online

Adiciona pagamento online ao produto. **Todo este bloco está `[BLOQ:gateway]`
até a escolha ser feita** (Woovi vs. Asaas vs. outro).

Diferente dos blocos 3 a 8, este **não tem dono único**: pagamento entra nas
duas superfícies ao mesmo tempo. A divisão segue a regra de **quem é dono da
superfície**, com uma única fatia compartilhada na frente.

## Entregável do bloco

Ao final:

- A cliente paga sinal ao marcar; o agendamento nasce `reservado` e vira `agendado` na confirmação.
- Reserva não paga expira e libera o slot.
- Cancelamento pelo salão gera reembolso automático quando aplicável.
- Conclusão pode gerar cobrança online do restante.
- Agendamento manual pode gerar link de sinal para a cliente.

## Estado do schema

`cobranca_gateway`, `webhook_gateway_evento`, `reembolso` e o campo
`agendamento.expira_em` **já existem** em `shared/schema/src/` desde
[0.4](./bloco-0-fundacao.md). O estado `reservado` já está previsto no enum de
`agendamento` — não precisa migration, só ativar o fluxo.

---

## Fatias

### 9.1 Módulo de pagamento e estado reservado

- [ ] Integração com o gateway **+** ativação do estado `reservado` no motor. — **🟣 Rudney** — [DEP: 2.2b](./bloco-2-motor.md#22b-motor-de-agendamento) `[BLOQ:gateway]`

**É a única fatia que bloqueia as outras.** Sai sem UI, testável por sandbox do
gateway. Vai para o dono do motor porque a mudança de máquina de estados é
dentro do motor.

**O que deve existir**

*Backend — gateway*

- Criação de cobrança no gateway escolhido, com `idempotency_key`.
- Recebimento de webhook, com registro em `webhook_gateway_evento` e normalização do tipo bruto do gateway.
- **Dedupe idempotente:** o mesmo evento chegando duas vezes não pode gerar dois agendamentos nem dois pagamentos. Regra crítica e com teste obrigatório ([CLAUDE.md](../../CLAUDE.md)).
- Vínculo `cobranca_gateway` → `pagamento_agendamento` → `agendamento`, gravando `pagamento_agendamento.tipo` (`sinal` ou `restante`) — é por ele que o [faturamento](./bloco-7-faturamento.md) separa as colunas de sinal e restante.
- Tratamento de pagamento recusado e expirado.

*Backend — estado reservado*

- Criação de agendamento em `reservado` com `expira_em`, calculado a partir de `configuracao_salao.prazo_reserva_min`.
- **Slot em `reservado` ocupa a agenda** — não aparece como livre para outra cliente nem para o salão.
- Promoção `reservado` → `agendado` na confirmação do pagamento, via webhook.
- Job de expiração: reserva não confirmada some e o slot volta a ficar livre.
- Múltiplas tentativas de pagamento dentro do prazo, sem o slot ser perdido a cada tentativa.

**Fora desta fatia**

- Qualquer tela (9.2 a 9.4).

**Decisões que precisam estar fechadas antes**

- **Escolher gateway.** Bloqueia o bloco inteiro.
- **Titular da conta de recebimento**: salão direto ou split via Fluy? Impacta o onboarding também.
- **Métodos aceitos**: só PIX ou PIX + cartão? Depende do gateway.
- **`expira_em`**: quanto tempo dura um `reservado`? Recomendação: 10-15 min.

**Critério de conclusão**

Criar cobrança na sandbox, receber o webhook e ver a promoção para `agendado`;
**reenviar o mesmo webhook e confirmar que nada duplica**; deixar uma reserva
expirar e ver o slot voltar aos horários livres.

**Tamanho estimado:** ~75-85 arquivos.

---

### 9.2 Sinal e checkout no fluxo da cliente

- [ ] O pagamento que foi deixado de fora da [4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente): resumo de valores, escolha, checkout e confirmação. — **🔵 Leandro** — [DEP: 9.1](#91-módulo-de-pagamento-e-estado-reservado) · [DEP: 4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)

**O que deve existir**

*Frontend + backend da superfície da cliente*

- Resumo de pagamento após escolher o horário: valor total e valor do sinal, calculado conforme a configuração do procedimento (percentual ou fixo) e **congelado no agendamento**.
- Escolha entre **pagar só o sinal** ou **pagar o total**.
- Redirecionamento/checkout do gateway e retorno ao app.
- Confirmação só depois do pagamento confirmado, com a tela de confirmação já existente da [4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente).
- Tratamento dos casos do fluxo 03: pagamento recusado (slot segue reservado, pode tentar outro método), reserva expirada durante o checkout (avisa e manda escolher outro horário), e slot tomado por race.
- Estado "seu pagamento pode ter sido processado, aguarde" quando a confirmação não chegou.
- Valor pendente = total − sinal pago, exibido no agendamento.

**Fora desta fatia**

- Fora do MVP, confirmado nos fluxos: limite de tentativas de pagamento, comprovante/nota fiscal emitidos pelo Fluy, reembolso quando o salão é desativado.

**Critério de conclusão**

`flows/cliente/03-criacao-agendamento.md` **completo**, incluindo os passos 10 a
15 que a 4.2 tinha pulado. Mais: abandonar o checkout e ver a reserva expirar;
recusar o pagamento e tentar de novo dentro do prazo.

**Tamanho estimado:** ~60-70 arquivos.

---

### 9.3 Reembolso no cancelamento

- [ ] Escolha de reembolso vs. retenção do sinal ao cancelar pelo salão. — **🟣 Rudney** — [DEP: 9.1](#91-módulo-de-pagamento-e-estado-reservado) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) `[DECIDIR: política de reembolso — ambig #3]`

**O que deve existir**

- Escolha de tratamento do sinal no modal de cancelamento da [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento), com o padrão sugerido sendo reembolsar (é decisão do salão, não da cliente).
- Reembolso via gateway, registrado em `reembolso`.
- Estado **"reembolso pendente" com retry** quando o gateway falha — o agendamento fica `cancelado` de qualquer forma, mas o dinheiro fica sinalizado.
- Reflexo no [Bloco 7](./bloco-7-faturamento.md): cancelamento com reembolso **não** é receita; sem reembolso, o sinal retido aparece na seção 4. O reembolso é descontado no período em que foi confirmado, nunca reabre período fechado (ambig #5) — a 7.1 ainda não desconta reembolso no faturamento por período.
- Cancelamento pela cliente e no-show continuam sempre retendo o sinal.

**Decisões que precisam estar fechadas antes**

- **Política de reembolso** (ambig #3, pendência 1): automático via gateway ou manual pelo salão fora do sistema?

**Critério de conclusão**

Cancelar com reembolso e ver o valor sair do faturamento; cancelar sem
reembolso e ver o sinal aparecer em "sinais retidos"; simular falha do gateway
e ver o estado de reembolso pendente.

**Tamanho estimado:** ~40-50 arquivos.

---

### 9.4 Cobranças online pelo painel

- [ ] Cobrança online do valor restante na conclusão **+** link de sinal no agendamento manual. — **🔵 Leandro** — [DEP: 9.1](#91-módulo-de-pagamento-e-estado-reservado) · [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual) · [DEP: 2.2c](./bloco-2-motor.md#22c-integrar-fluxo-manual)

**Por que juntas:** são a mesma capacidade — o salão gerando uma cobrança
online a partir do painel — em dois pontos de entrada. Separadas, seriam dois
PRs pequenos repetindo a mesma integração.

**O que deve existir**

- No modal de conclusão da [3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual): quando ainda falta valor, opção de **gerar cobrança online do restante** em vez de registrar pagamento manual.
- Na tela de agendamento manual ([2.2a](./bloco-2-motor.md#22a-tela-de-agendamento-manual)): escolha entre "sem sinal", "sinal registrado como pago" (dinheiro/manual) e "gerar link de sinal para a cliente". A terceira opção cria o agendamento em `reservado`; as duas primeiras, direto em `agendado`.
- Conclusão só fecha quando a cobrança confirma, ou o salão volta para o registro manual.

**Critério de conclusão**

Concluir um atendimento gerando cobrança online do restante e ver o pagamento
confirmar; criar um agendamento manual com link de sinal e ver o estado sair de
`reservado` quando a cliente paga.

**Tamanho estimado:** ~55-65 arquivos.

---

## Divisão e por quê

Depois de 9.1, cada um mexe **na superfície que já é dele**:

- **🟣 Rudney** (motor + painel): 9.1, 9.3.
- **🔵 Leandro** (cliente + agendamento manual): 9.2, 9.4.

9.4 encosta na tela de conclusão, que é do 🟣 Rudney — mas chega quando o
[Bloco 3](./bloco-3-painel-operacao.md) está fechado há muito tempo, e serve
para equilibrar a carga.

**Sequência:**

1. 🟣 Rudney faz 9.1 sozinho. Enquanto isso, 🔵 Leandro fecha o que sobrou dos blocos 6 e 8.
2. Com 9.1 mergeada: 🔵 Leandro puxa 9.2 (a mais delicada) e 🟣 Rudney puxa 9.3.
3. 9.4 por último.

## Decisões pendentes deste bloco

- [ ] **Escolher gateway** (Woovi vs. Asaas vs. outro). **Bloqueia o bloco inteiro.**
- [ ] **Titular da conta de recebimento**: salão direto ou split via Fluy?
- [ ] **Política de reembolso** (ambig #3, pendência 1).
- [ ] **Métodos aceitos**: só PIX ou PIX + cartão?
- [ ] **`expira_em`** — quanto tempo dura um `reservado`? Recomendação: 10-15 min. Já existe `configuracao_salao.prazo_reserva_min`.

## Notas

- **Webhook precisa de URL pública.** CI e staging estão adiados por decisão do time ([README](./README.md#definição-de-pronto-dod)); para a 9.1 isso deixa de ser opcional. Ou sobe staging antes deste bloco, ou o desenvolvimento local usa túnel (ngrok/cloudflared) e o dedupe fica coberto só no teste automatizado.
- **9.2 é a fatia mais delicada do bloco.** Reintroduz o `reservado` que a 4.2 pulou, mudando o que a cliente vê na criação inteira. Vale par de revisão mesmo com dono único.
- Reserva expirada é apagada por job; a agenda do dia ([3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)) passa a exibir cards `reservado` de verdade e o [Bloco 6](./bloco-6-notificacoes.md) ganha o destaque de "expirando em breve".
