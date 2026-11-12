# FLY-003 · Reserva pendente e expirada: a cliente fica travada

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Página pública · Checkout · Meus agendamentos · Backend de agendamento |
| **Origem** | Relato do dono (agendamento expirado) + auditoria |
| **Relacionadas** | [FLY-004 · Checkout da cliente](./FLY-004-checkout-da-cliente.md), [FLY-005 · Confiabilidade do pagamento](./FLY-005-confiabilidade-do-pagamento-online.md) |

## Descrição

### Estados envolvidos

**Agendamento:**

- Nasce `reservado`, com `expira_em` (padrão de 15 minutos, configurável no salão).
- Se o pagamento chega no prazo, vira `agendado`.
- Se o prazo vence, um job que roda a cada minuto o muda para `cancelado`, com o evento "Reserva expirada." (`backend/src/modules/pagamento/pagamento-expiracao.service.ts:16-35`, `pagamento.repository.ts:417-456`).

**Cobrança:**

- Segue `iniciando` → `pendente` → `confirmada` / `falhou` / `expirada`.
- Quando a confirmação chega depois do prazo, o resultado é `confirmado_apos_expiracao`.

### Pontos em que a cliente trava

**a. Não dá para desistir da reserva.**

- A cliente só cancela agendamentos `agendado`:
  - back: `agendamento-publico.service.ts:99-101`;
  - front: `meus-agendamentos.component.html:87`.
- O doc `docs/flows/cliente/04-cancelamento.md` diz que cancelar uma reserva "simplesmente descarta", mas isso não foi implementado.
- O botão "Escolher outro horário" do checkout (`checkout.page.html:268`) não libera o horário reservado.

**b. Não dá para remarcar no mesmo dia enquanto a reserva não expira.**

- `possuiAgendamentoDoProcedimentoNoDia` conta também os agendamentos `reservado` (`agendamento.repository.ts:520-535`).
- Até o job rodar, a cliente recebe "A cliente já possui este procedimento agendado neste dia." (`agendamento.service.ts:279-288`).
- A mensagem fala dela em terceira pessoa e não oferece "retomar pagamento".

**c. O botão "Retomar pagamento" nunca some.**

- Os contextos de checkout guardados em `localStorage` nunca são apagados: nem ao confirmar, nem ao expirar, nem ao cancelar (`checkout.service.ts:86-132`).
- "Retomar pagamento de X" fica para sempre no topo da tela inicial (`pagina-cliente.page.html:2-6`). Aparece:
  - depois do pagamento confirmado;
  - antes do cabeçalho da página;
  - nos estados de carregando e de erro;
  - com reservas de **outra identificação** (filtra por salão, não pela cliente).
- Ao abrir uma reserva já expirada:
  - o formulário de pagamento aparece de novo (`checkout.page.html:187`);
  - a cliente preenche CPF e banco;
  - só então recebe 409 "A reserva expirou ou foi encerrada." (`pagamento.service.ts:112-118`).

**d. Não dá para pagar a própria reserva em outro contexto.**

- A retomada é vinculada ao hash da credencial do aparelho, não à cliente (`checkout.service.ts:234-237`).
- Depois de "Agendar como outra pessoa" e voltar como ela mesma, aparece "Esta reserva pertence a outra identificação. Fale com o salão.". O backend aceitaria, porque é a mesma cliente.
- Em outro navegador, ou com o `localStorage` limpo, também não há como pagar: "Meus agendamentos" não tem a ação "Pagar" para `reservado`.

**e. "Cancelado" sem explicação.**

- Em "Meus agendamentos", a reserva expirada aparece só como "Cancelado", sem motivo.
- Se a cliente pagou depois do prazo, aparece "Cancelado" com o dinheiro já pago e nenhuma orientação fora do checkout.
- A lista mostra `reservado` sem prazo e sem status de pagamento (`meus-agendamentos.component.html:162-187`).

### Os docs divergem do código

- `docs/domain/agendamento.md` (linhas 32, 48, 64 e 109) diz que a reserva expirada é "apagada" ou "deixa de existir".
- O código cancela a reserva, e a linha 5 do mesmo doc diz que ela é preservada.

## Comportamento esperado

- **Prazo visível.** A cliente sempre sabe quanto tempo tem para pagar.
- **Desistir libera o horário.** A cliente pode desistir de uma reserva, e o horário volta a ficar livre na hora.
- **Reserva vencida não bloqueia.** Uma reserva vencida nunca impede a cliente de agendar de novo, mesmo antes de o job rodar.
- **Retomar fica onde faz sentido.** "Retomar pagamento" só aparece para reservas da cliente atual que ainda estão no prazo e pendentes. Fica também disponível no detalhe da reserva em "Meus agendamentos", sem depender do navegador.
- **Expirada não abre formulário.** Uma reserva expirada mostra "Reserva expirada" com a próxima ação ("Escolher novo horário"), nunca o formulário de pagamento.
- **Pagamento tardio orientado.** Quem pagou depois do prazo vê o status "Pago após o prazo. Fale com o salão" e um botão de WhatsApp do salão.

## O que precisa ser feito

### Backend

- Permitir que a cliente cancele `reservado` (descarte, sem sinal retido). Registrar o evento e marcar como expiradas as cobranças ativas.
- Nas checagens de duplicidade no dia e de horário ocupado, ignorar `reservado` com `expira_em` já vencido.
- Expor `expira_em` e o status do pagamento no agendamento público (lista e detalhe).
- Permitir retomar o pagamento a partir do agendamento da cliente, autorizado pela cliente da sessão e não pela credencial do aparelho. Respeitar as regras de [FLY-001](./FLY-001-identificacao-da-cliente-sem-verificacao.md).
- Ajustar a mensagem de duplicidade para falar com a cliente e citar a reserva pendente: "Você já tem uma reserva aguardando pagamento neste dia."

### Frontend

- Apagar o contexto de checkout do `localStorage` quando:
  - o status for terminal (confirmado, expirado, cancelado);
  - ou o servidor responder 409 de reserva encerrada.
- Mostrar "Retomar pagamento" só para reservas da cliente atual ainda no prazo, abaixo do cabeçalho e fora dos estados de carregando e de erro.
- Checkout:
  - contagem regressiva até `expira_em`;
  - ao vencer, trocar o formulário por "Reserva expirada" e o botão "Escolher novo horário".
- "Escolher outro horário" descarta a reserva antes de voltar.
- Meus agendamentos:
  - `reservado` com prazo e botão "Pagar" e "Desistir";
  - status "Reserva expirada" (e não "Cancelado") quando o motivo for expiração;
  - status "Pago após o prazo" com contato do salão quando houver divergência.

### Docs

- Alinhar `docs/domain/agendamento.md` e `docs/flows/cliente/04-cancelamento.md` ao comportamento real: a reserva expirada é cancelada e preservada no histórico.

## Critérios de conclusão

- [ ] A cliente desiste de uma reserva e o horário volta a aparecer livre na mesma hora.
- [ ] Depois de a reserva vencer, a cliente agenda o mesmo procedimento no mesmo dia sem esperar o job.
- [ ] O botão "Retomar pagamento" some depois do pagamento confirmado, da expiração ou do cancelamento.
- [ ] O botão "Retomar pagamento" não aparece para outra identificação.
- [ ] Abrir uma reserva expirada nunca mostra o formulário de pagamento.
- [ ] A cliente consegue pagar a reserva no prazo a partir de "Meus agendamentos", em outro navegador.
- [ ] O checkout mostra a contagem regressiva do prazo.
- [ ] Os status "Reserva expirada" e "Pago após o prazo" aparecem com orientação.
- [ ] Os docs de domínio e de fluxo estão alinhados.
