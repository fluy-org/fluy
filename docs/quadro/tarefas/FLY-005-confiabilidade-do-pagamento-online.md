# FLY-005 · Confiabilidade do pagamento online: prazo, confirmação e avisos

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Backend de pagamento (Efí) · Retorno do pagamento · Avisos ao salão |
| **Origem** | Pedido do dono de avaliar todo o fluxo de pagamento (auditoria) |
| **Relacionadas** | [FLY-003 · Reserva pendente e expirada](./FLY-003-reserva-pendente-e-expirada.md), [FLY-004 · Checkout da cliente](./FLY-004-checkout-da-cliente.md) |

## Descrição

A auditoria do fluxo completo, do toque em "Reservar" até o agendamento confirmado, encontrou cinco problemas que fazem dinheiro e agenda divergirem, ou que deixam salão e cliente sem saber o que aconteceu.

### 1. O banco não sabe do prazo da reserva

- `createPixPayment` não envia a expiração para a Efí (`backend/src/shared/providers/payment/efi/efi-payment.provider.ts`).
- Quando a reserva expira, a cobrança local vira `expirada` (`pagamento.repository.ts:442-454`), mas a autorização no banco continua válida.
- A cliente ainda consegue autorizar depois do prazo. O resultado é `confirmado_apos_expiracao` (`pagamento-estado-utils.ts:45-53`):
  - o agendamento fica cancelado;
  - o dinheiro vai para o salão;
  - não há estorno automático.

### 2. Um pagamento feito no prazo pode ser tratado como atrasado

- A decisão de "dentro ou fora do prazo" usa `agora`, ou seja, a hora em que o sistema processa a confirmação (`pagamento.repository.ts`, por volta da linha 302).
- O certo seria usar `ocorridoEm`, a hora do pagamento informada pelo provider.
- Um webhook atrasado, ou uma consulta feita minutos depois, transforma um pagamento feito a tempo em "pago após expiração".

### 3. A confirmação depende de alguém estar olhando

- O agendamento só é confirmado pelo webhook ou pela consulta que o checkout faz (polling de 5 s, até 120 vezes; `checkout-data.ts`, `checkout.service.ts:318-346`).
- Se o webhook falhar e a cliente fechar a página, a reserva expira mesmo com o pagamento feito.
- Não existe uma reconciliação no servidor que consulte as cobranças pendentes antes de expirar a reserva.

### 4. O retorno do banco depende do mesmo navegador

- `/retorno-pagamento` (`frontend/src/app/features/pagina-cliente/pages/retorno-pagamento/retorno-pagamento.page.ts`) procura a reserva no `localStorage`.
- Links de WhatsApp abrem no navegador interno do app, e o banco devolve a cliente para o navegador padrão. O resultado provável é "Não encontramos uma reserva neste navegador".
- Esse cenário não foi testado em aparelho. Validar.
- A URL de retorno é configurada na Efí, não no código. Confirmar qual é a atual.

### 5. O salão não é avisado de agendamento pago

- A promoção da reserva para `agendado` (`pagamento.repository.ts`, por volta das linhas 392-410) não dispara aviso ao salão.
- Só o fluxo sem sinal chama `notificarCriacaoPublica` (`agendamento-publico.service.ts:193`).
- O pagamento tardio (`confirmado_apos_expiracao`) também não avisa ninguém, embora exija ação manual do salão (devolver o dinheiro ou encaixar a cliente).
- O doc `docs/flows/salao/06-agenda-dia.md` pede também um aviso de "reserva prestes a expirar", que não existe.

## Comportamento esperado

- Uma autorização só pode ser concluída no banco dentro do prazo da reserva. Se o provider não aceitar prazo, a cobrança é cancelada no provider quando a reserva expira.
- "Dentro do prazo" é decidido pela hora do pagamento, não pela hora do processamento.
- Uma reserva com cobrança pendente é conferida no provider antes de expirar. Se estiver paga, vira `agendado`.
- Ao voltar do banco em qualquer navegador, a cliente vê o status do agendamento, ou pelo menos um caminho claro para "Meus agendamentos".
- O salão recebe um aviso quando:
  - um agendamento pago é confirmado;
  - um pagamento chega depois do prazo, com a orientação do que fazer.

## O que precisa ser feito

**Prazo e reconciliação:**

- Enviar a expiração à Efí na criação da cobrança, ou cancelar a cobrança ao expirar a reserva. Conferir o que o Open Finance da Efí suporta e registrar em `docs/process/`.
- Usar `ocorridoEm` na decisão de expiração. Se o provider não informar, usar a hora do evento do webhook.
- No job de expiração (`pagamento-expiracao.service.ts`), consultar no provider as cobranças `pendente` antes de cancelar a reserva.

**Retorno do pagamento:**

- Fazer `/retorno-pagamento` identificar a cobrança por um parâmetro que a Efí devolve, ou por um identificador público da reserva. Assim a página funciona sem o `localStorage` e sem expor dados da cliente.
- Se não for possível, mostrar a mensagem "Abra o link do salão para ver o seu agendamento", com botão.

**Avisos ao salão:**

- Criar os tipos de aviso "Agendamento pago confirmado" e "Pagamento recebido após o prazo" (`backend/src/modules/aviso`).
- Avaliar o aviso de "reserva prestes a expirar".

**Testes e docs:**

- Testes automatizados do fluxo de pagamento, que é regra crítica:
  - confirmação no prazo com processamento atrasado;
  - expiração com cobrança paga não notificada;
  - pagamento após o prazo.
- Atualizar `docs/features/pagamentos.md` e `docs/process/fluxo-pagamento-execucao.md`.

## Decisão de produto em aberto

Avaliar Pix com QR Code ou copia e cola como alternativa ao Open Finance. A cliente não precisaria informar CPF e banco. O doc `docs/process/fluxo-pagamento-execucao.md:80` registra "sem fabricar QR Code", então isso é uma decisão a revisitar, não parte desta tarefa.

## Critérios de conclusão

- [ ] Uma autorização feita no banco depois de `expira_em` não resulta em dinheiro recebido sem agendamento, ou a cobrança é cancelada no provider.
- [ ] Um pagamento feito antes de `expira_em` e processado depois é tratado como "no prazo".
- [ ] Uma reserva paga cujo webhook não chegou é confirmada pelo job antes de expirar.
- [ ] Voltar do banco em outro navegador não deixa a cliente sem caminho.
- [ ] O salão recebe aviso de agendamento pago e de pagamento após o prazo.
- [ ] Os testes automatizados dos três cenários estão verdes.
