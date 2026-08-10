# Cliente — Criação de agendamento

## Objetivo

Permitir que a cliente reserve e pague por um horário para realizar um procedimento no salão, com feedback claro sobre disponibilidade, valores, informações pré-procedimento e política do estabelecimento.

## Passo a passo

1. Cliente identificada (via [primeiro acesso](./01-primeiro-acesso.md) ou [retorno](./02-retorno.md)) entra no fluxo.
2. Sistema exibe lista de procedimentos ativos do salão (com nome, descrição, imagem, duração e preço).
3. Cliente seleciona **um** procedimento.
4. Sistema exibe calendário/lista com dias disponíveis (respeitando antecedência mínima e máxima do salão).
5. Cliente escolhe um **dia**.
6. Sistema calcula e exibe os **horários de início disponíveis** naquele dia (ver "Regras de negócio").
7. Cliente escolhe um **horário**.
8. Sistema **reserva o slot temporariamente** por X minutos (X definido pelo salão) e avança.
9. (Opcional) Cliente adiciona **imagens de referência** ao agendamento.
10. Sistema exibe **resumo do pagamento**: valor total do procedimento e valor do sinal (calculado conforme configuração do procedimento — percentual ou fixo).
11. Cliente escolhe **pagar apenas o sinal** OU **pagar o valor total**.
12. Sistema inicia a transação com o gateway de pagamento.
13. Cliente conclui o pagamento pelo gateway (fluxo específico do método escolhido: PIX, cartão, etc.).
14. Gateway confirma pagamento via webhook.
15. Sistema promove a reserva de `Reservado` para `Agendado`.
16. Sistema exibe **tela de confirmação** com:
    - Data, horário, procedimento, endereço do salão
    - Informações pré-procedimento (configuráveis pelo salão)
    - Mensagem personalizada do salão
    - Política de atraso (tolerância global do salão)
    - Botão "Adicionar ao calendário" (`.ics`)
    - Opção de ativar notificações PWA push
17. Salão recebe notificação in-app + push PWA sobre o novo agendamento.

## Variações

- **Sucesso (pagou sinal):** agendamento confirmado, valor restante fica pendente para pagamento presencial no dia.
- **Sucesso (pagou total):** agendamento confirmado, sem valor pendente.
- **Cliente abandona antes de escolher horário:** reserva não é criada, sem consequência.
- **Cliente abandona após reservar temporariamente:** reserva expira em X minutos e slot libera automaticamente.
- **Pagamento recusado/falho:** slot permanece reservado dentro do prazo de X minutos; cliente pode tentar outro método sem escolher horário de novo.
- **Pagamento expirou dentro do prazo:** slot libera, cliente precisa recomeçar (escolher horário de novo).
- **Cliente escolhe procedimento que fica inativo entre a seleção e o pagamento:** validar no momento de reservar; se inativo, informar e voltar à lista.
- **Slot escolhido é tomado por outra cliente que pagou primeiro:** raro (garantido pelo bloqueio na reserva), mas se acontecer por race condition, informar e pedir para escolher outro.

## Regras de negócio

**Cálculo de horários disponíveis:**
- Sistema considera as **janelas de disponibilidade do dia** (template semanal + overrides por data).
- Sistema considera os **agendamentos já existentes** naquela data (estados `Reservado` e `Agendado`).
- **Granularidade dos horários iniciais** é configurável pelo salão (default 30min). Ex.: 10:00, 10:30, 11:00…
- Um horário só é oferecido se: `hora_inicio + duracao_procedimento ≤ hora_fim_da_janela` (não pode ultrapassar a janela).
- Um horário só é oferecido se: intervalo `[hora_inicio, hora_inicio + duracao_procedimento]` não conflita com nenhum outro agendamento existente.
- O procedimento **não pode cruzar duas janelas** do mesmo dia (respeita almoço/pausa).
- **Antecedência mínima** e **máxima** configuradas pelo salão filtram os dias/horas exibidos.

**Reserva temporária:**
- Ao selecionar horário, slot vai para estado `Reservado`, com timestamp de expiração.
- Se pagamento não confirmar em X minutos (X configurável pelo salão), reserva expira e slot volta a `Livre`.
- Durante `Reservado`, slot NÃO aparece disponível para outras clientes.

**Sinal:**
- Configuração é **por procedimento** — cada procedimento tem seu próprio sinal (percentual OU valor fixo).
- Cliente pode escolher pagar sinal OU total.
- Se pagou só sinal: `valor_pendente = valor_total - sinal_pago`, exibido no agendamento e cobrado presencialmente no dia (fluxo do salão).

**Um procedimento por agendamento** no MVP.

**Duração do procedimento é congelada no momento do agendamento** — se salão alterar duração no catálogo depois, este agendamento mantém a duração original.

## Dependências

- **Identificação da cliente** (primeiro acesso ou retorno) já resolvida.
- **Configuração de disponibilidade** do salão (senão não há horários para oferecer).
- **Catálogo de procedimentos** do salão com pelo menos 1 ativo.
- **Integração com gateway de pagamento** (a ser definida — Woovi ou Asaas).
- **Configuração do salão** (sinal, tolerância, granularidade, antecedências, informações pré-procedimento, mensagem personalizada).
- **Sistema de notificação para o salão** (in-app + push PWA).

## Casos extremos (edge cases)

- **Race condition entre 2 clientes clicando no mesmo slot ao mesmo tempo:** a primeira a chegar no servidor "ganha" a reserva; a segunda recebe erro e é convidada a escolher outro horário.
- **Cliente escolhe último slot do dia; procedimento tem duração que ultrapassa fim da janela:** sistema já filtra e não oferece esse horário.
- **Cliente selecionou horário, iniciou pagamento, servidor caiu antes do webhook:** reserva permanece até expirar; ao voltar, sistema mostra "seu pagamento pode ter sido processado; aguarde/consulte".
- **Webhook do gateway chega em dobro (retry):** deve ser idempotente — não gerar dois agendamentos.
- **Cliente tenta enviar imagem gigante (>10MB) como referência:** validar limite e comprimir/rejeitar.
- **Cliente sem WhatsApp válido no cadastro tenta pagar:** o pagamento pode ir adiante (não bloqueia), mas comunicação futura fica prejudicada. Considerar validar antes.
- **Salão altera a janela de disponibilidade durante o fluxo:** cliente pode ter visto horário que já não é mais válido; validar novamente ao reservar.
- **Cliente escolhe pagamento total mas gateway só suporta PIX (ex.: valor alto):** limitar por gateway ou informar.
- **Reserva expira enquanto cliente está preenchendo dados de cartão:** informar claramente que o slot foi liberado e pedir nova escolha.

## Dúvidas em aberto

- **Múltiplas tentativas de pagamento dentro do prazo:** decidido "slot fica reservado, cliente pode tentar outro método". Precisa desenhar como isso funciona: quantas tentativas? Se cartão recusa 3x, força PIX? MVP pode ser "ilimitado até expirar".
- **Comprovante de pagamento:** cliente precisa receber comprovante? Por qual canal? Provavelmente responsabilidade do gateway; validar.
- **Reembolso:** decidido "sinal não é devolvido em cancelamento". Mas se o pagamento falhar do lado do salão (ex.: salão desativado), há reembolso? Não coberto no MVP.
- **Nota fiscal/recibo:** salão emite? Fluy participa disso? Fora do MVP, mas pode virar demanda cedo.
- **Cliente pode ter mais de um agendamento ativo simultaneamente no mesmo salão?** Provavelmente sim (ex.: agendar corte pra sexta e coloração pro sábado). Confirmar.
