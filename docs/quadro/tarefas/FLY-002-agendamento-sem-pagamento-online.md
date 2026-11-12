# FLY-002 · Agendar sem pagamento online: salão sem Pix e opção "pagar no salão"

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer, **depende de decisão de produto** (ver "Decisões necessárias") |
| **Prioridade** | Alta |
| **Área** | Página pública · Configuração do procedimento · Backend de agendamento e pagamento |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-006 · Primeiros passos do salão](./FLY-006-primeiros-passos-do-salao.md), [FLY-004 · Checkout da cliente](./FLY-004-checkout-da-cliente.md), [FLY-011 · Procedimentos](./FLY-011-procedimentos.md) |

## Descrição

### 1. Salão sem chave Pix bloqueia o agendamento

Quando o procedimento tem sinal, a página pública sempre faz uma reserva com pagamento.

- **Front:** `pagina-cliente.page.ts:549-558` chama `checkout.reservar` (`POST /reservas`) sempre que `valor_sinal > 0`.
- **Back:** `PagamentoPublicoService.reservar` (`backend/src/modules/pagamento/pagamento-publico.service.ts:39-46`) chama `recebimentoPix.buscar`, que lança 404 **"Recebimento Pix não cadastrado."** (`backend/src/modules/salao-configuracao/recebimento-pix.service.ts:11-17`). Essa mensagem aparece crua para a cliente.

Não existe saída alternativa: o `POST /agendamentos` público recusa sinal positivo com 409 "Este procedimento exige reserva e pagamento do sinal." (`agendamento.service.ts:304-311`, `exigirSemSinal: true` em `agendamento-publico.service.ts:178-181`).

O mesmo bloqueio acontece quando o pagamento online está desligado (`PAYMENT_PROVIDER=disabled`, padrão em `env.schema.ts:47`), com a mensagem "Pagamento online indisponível.". Em qualquer ambiente sem Efí, **todo procedimento com sinal fica impossível de agendar** pelo link.

Nada impede o salão de cadastrar sinal sem ter Pix. O salão também não fica sabendo que está perdendo agendamentos (ver [FLY-006](./FLY-006-primeiros-passos-do-salao.md)).

### 2. A cliente não pode escolher pagar no salão

Hoje a cliente só descobre que vai pagar online na última etapa.

- O catálogo mostra só duração e preço. **Não mostra o sinal** (`catalogo-procedimentos.component.html:59-62`).
- A revisão também não mostra o sinal. Só tem o botão "Reservar e ir ao pagamento" (`confirmacao-agendamento.component.html:128`).
- O checkout oferece só "Somente o sinal" ou "Valor total" (`checkout.page.html:190-202`).

Não existe configuração de sinal opcional, nem de aceitar pagamento presencial: o salão só define `tipo_sinal` e `valor_sinal` por procedimento.

### 3. Mensagem de cancelamento errada

Em "Meus agendamentos", o cancelamento sempre avisa "o sinal pago (R$ X) não será devolvido" (`meus-agendamentos.component.html:95-97`). Isso aparece mesmo quando o sinal é R$ 0,00 ou quando nada foi pago. Com a mudança desta tarefa, esse caso passa a ser comum.

### Regra de estado hoje

- Sem sinal, o agendamento nasce `agendado`.
- Com sinal, nasce `reservado` com `expira_em` (`agendamento.service.ts:317-337`).
- O agendamento manual do salão já nasce `agendado` com `valor_sinal > 0` sem pagamento. Existe precedente para o caso "sinal devido no salão".

## Comportamento esperado

**Salão sem pagamento online disponível** (sem chave Pix ou provider desligado):

- A cliente agenda normalmente.
- O agendamento nasce `agendado`.
- A cliente vê a orientação "O pagamento é feito diretamente no salão".
- O salão vê no painel um aviso claro do que está perdendo (tratado em [FLY-006](./FLY-006-primeiros-passos-do-salao.md)).

**Salão com pagamento online:**

- O salão escolhe, por procedimento, se o sinal online é **obrigatório** ou **opcional**.
- Quando é opcional, a cliente escolhe entre:
  - "Pagar o sinal agora (Pix)";
  - "Pagar o total agora";
  - "Pagar no salão".

**Antes de confirmar, a cliente sempre vê:**

- o valor do sinal e se ele é obrigatório;
- o prazo para pagar;
- o que vai precisar (CPF e banco).

O sinal também aparece no catálogo.

**Cancelamento:** a mensagem só fala em sinal retido quando existe pagamento confirmado.

## Decisões necessárias (antes de codar)

1. **Política de sinal:**
   - por procedimento (`politica_sinal: obrigatorio | opcional`);
   - ou por salão, com exceção por procedimento.
2. **Sinal obrigatório sem pagamento online:**
   - (a) cai para "pagar no salão" automaticamente (sugerido, alinhado ao pedido do dono);
   - ou (b) impedir o salão de marcar o sinal como obrigatório sem Pix.
3. **"Pagar no salão" com sinal configurado:**
   - o `valor_sinal` congelado no agendamento passa a significar "sinal devido presencialmente";
   - o faturamento não usa `agendamento.valor_sinal` (usa os pagamentos), então não há impacto financeiro.

Registrar as decisões em `docs/flows/PENDENCIAS.md`.

## O que precisa ser feito

### Backend e schema

- Criar um derivado `pagamento_online_disponivel`: provider diferente de `disabled` **e** recebimento Pix completo. Expor na resposta pública do salão ou do procedimento.
- Adicionar a política de sinal ao schema de `procedimento`, com migration e valor padrão que preserva o comportamento atual (`obrigatorio`).
- `POST /agendamentos` público:
  - aceita sinal positivo quando `pagamento_online_disponivel` é falso;
  - aceita sinal positivo quando a política é opcional e a cliente escolheu pagar no salão;
  - recebe a escolha da cliente no corpo.
- Garantir que nenhuma resposta pública traga "Recebimento Pix não cadastrado." como erro para a cliente.

### Frontend: cliente

- Decidir o caminho pelo derivado e pela política, não só por `valor_sinal > 0` (`pagina-cliente.page.ts:549-558`).
- Na revisão, criar o passo "Como você quer pagar?" quando houver escolha.
- Quando não houver pagamento online, mostrar só o texto informativo.
- Mostrar o sinal no catálogo e na revisão (valor, obrigatório ou não, prazo da reserva, necessidade de CPF e banco).
- Corrigir a mensagem de cancelamento em `meus-agendamentos.component.html:95-97`: depender de existir pagamento confirmado.

### Frontend: salão

- No formulário de procedimento ([FLY-011](./FLY-011-procedimentos.md)), adicionar o controle "Sinal obrigatório / opcional" com explicação.
- No detalhe do agendamento, indicar "Pagamento no salão" quando a cliente escolheu essa opção.

### Docs

- `docs/domain/agendamento.md:5` ("Sinal positivo no fluxo público exige reserva...").
- `docs/flows/cliente/03-criacao-agendamento.md` (passo 11 e "Falha de provider não dispensa pagamento").
- `docs/features/pagamentos.md` e `docs/features/gestao-procedimentos.md`.

## Critérios de conclusão

- [ ] Um salão sem chave Pix recebe agendamentos de procedimento com sinal pelo link, e eles nascem `agendado`.
- [ ] Com `PAYMENT_PROVIDER=disabled`, o agendamento público funciona para qualquer procedimento.
- [ ] Com sinal opcional e Pix configurado, a cliente escolhe entre pagar agora e pagar no salão.
- [ ] O agendamento reflete a escolha da cliente no painel.
- [ ] O sinal aparece no catálogo e na revisão antes de qualquer reserva.
- [ ] A mensagem "o sinal pago não será devolvido" só aparece quando houve pagamento confirmado.
- [ ] As decisões e os docs listados estão atualizados.
