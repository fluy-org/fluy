# Bloco 4 — Cliente final

O app/PWA que a cliente do salão usa no celular dela. Diferencial do produto.

## Entregável do bloco

Ao final, a cliente do salão consegue:
- Acessar a página do salão (`subdominio.fluy.app`) pelo celular.
- Ser identificada por UUID de dispositivo + WhatsApp.
- Marcar horário sozinha (sem pagamento — vem no Bloco 5).
- Cancelar seu próprio agendamento.
- Receber notificação quando o salão altera algo.

## Fatias

### 4.1 Primeiro acesso

- [ ] `cliente/01-primeiro-acesso` — página pública do salão (`subdominio.fluy.app`), identificação por UUID de dispositivo + WhatsApp. Entities: `sessao_cliente`. — **🔵 Leandro** — [DEP: bloco 0](./bloco-0-fundacao.md) · [DEP: 1.1](./bloco-1-setup-salao.md#11-onboarding) `[DECIDIR: LGPD mínimo — pelo menos consentimento básico + política de privacidade]`

### 4.2 Retorno

- [ ] `cliente/02-retorno` — cliente com UUID salvo reconhecida automaticamente. Sem tela nova; lógica no serviço de identificação. Praticamente embutida em 4.1. — **🔵 Leandro** — [DEP: 4.1](#41-primeiro-acesso)

### 4.3 Criacao de agendamento

- [ ] `cliente/03-criacao-agendamento` — **parte sem pagamento**: cliente escolhe procedimento → escolhe horário → confirma. Reserva vai direto para `agendado` (pulando `reservado` e sinal). Reutiliza o motor de criação de agendamentos da 2.2b. — **🟣 Rudney** — [DEP: 4.1](#41-primeiro-acesso) · [DEP: 2.2b](./bloco-2-motor.md#22b-motor-de-agendamento) · [DEP: 1.3](./bloco-1-setup-salao.md#13-be-procedimentos) · [DEP: 1.4](./bloco-1-setup-salao.md#14-be-disponibilidade) `[BLOQ:gateway — cobrar sinal + estado reservado + expira_em fica para 5.2]`

### 4.4 Cancelamento pela cliente

- [ ] `cliente/04-cancelamento` — cliente cancela seu próprio agendamento (janela de cancelamento respeita `configuracao_salao.antecedencia`). — **🔵 Leandro** — [DEP: 4.3](#43-criacao-de-agendamento)

### 4.5 Notificacao de alteracao

- [ ] `cliente/05-notificacao-alteracao` + módulo de notificações — quando salão altera algo, cliente é avisada. — **🟣 Rudney** — [DEP: 4.1](#41-primeiro-acesso) · [DEP: 2.6](./bloco-2-motor.md#26-cancelamento) · [DEP: 2.7](./bloco-2-motor.md#27-remarcacao) `[DECIDIR: canal de notificação — push PWA vs. .ics vs. WhatsApp — ambig #13, #14]`

## Divisão e por quê

**🔵 Leandro** (3): 4.1 (primeiro acesso — raiz do bloco, tela mobile densa), 4.2 (embutido em 4.1), 4.4 (cancelamento cliente — tela).

**🟣 Rudney** (2): 4.3 (agendamento cliente — reutiliza o motor de criação da 2.2b, mas a parte cliente é nova), 4.5 (notificações — infra nova, service worker, push).

**Alternância:** 🔵 Leandro sai do faturamento (3.2, mais analítico) para telas mobile (mudança total de contexto). 🟣 Rudney sai de lembretes (3.1) para reaproveitar motor de agendamento (2.2b) — casa com o que ele conhece.

**Balanceamento:** 3 x 2, mas 4.2 é quase de graça (embutido em 4.1), então na prática é 2 x 2. 4.5 é a mais pesada do bloco (push notification + service worker é bicho novo); 🟣 Rudney tem menos itens mas mais complexos.

**Sequência sugerida:**
1. 🔵 Leandro começa 4.1 (bloqueia 4.3 e 4.4). 🟣 Rudney pode adiantar algo pendente do Bloco 3 ou começar 5.1 se gateway já foi decidido.
2. Assim que 4.1 sai, 🟣 Rudney puxa 4.3 e 🔵 Leandro puxa 4.4.
3. 4.5 depois, quando decisão de canal for tomada.

## Decisões pendentes deste bloco

- [ ] **LGPD mínima** (ambig #10, pendência 3): consentimento no primeiro acesso? Política de privacidade acessível? Decidir antes de 4.1.
- [ ] **Canal de notificação** (ambig #13, #14): push PWA vs. `.ics` vs. WhatsApp. Impacta 4.5 fortemente e outras features futuras.
- [ ] **Schema do deep link** de push (ambig #14): definir antes de 4.5.
- [ ] **Validação de WhatsApp** (pendência 7): MVP aceita sem validar (risco de agendamento fantasma). Confirmar decisão antes de 4.1.
- [ ] **Estratégia de tempo real** (ambig #13): websocket ou polling curto para painel do salão receber "novo agendamento do cliente"?

## Notas

- 4.5 pode ser bem grande. Se ficar >1 semana de trabalho, considerar quebrar em 4.5a (push infra) e 4.5b (integração com fluxos existentes de cancelamento/remarcação).
