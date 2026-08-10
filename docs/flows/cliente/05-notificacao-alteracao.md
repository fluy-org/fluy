# Cliente — Recebimento de alteração feita pelo salão

## Objetivo

Comunicar à cliente que o salão remarcou ou cancelou um agendamento dela, garantindo que ela tome conhecimento e, quando aplicável, atualize o evento salvo em seu calendário nativo.

## Passo a passo (remarcação pelo salão)

1. Salão altera data/hora do agendamento pelo painel (ver [remarcação pelo salão](../salao/09-remarcacao.md)).
2. Sistema gera um novo `.ics` de update (mesmo UID original, `SEQUENCE` incrementado, `METHOD:REQUEST`).
3. Sistema dispara **push PWA** para a cliente (se ela ativou notificações): "Seu agendamento foi remarcado para [nova data/hora]".
4. Push contém link/deep link para o app do Fluy.
5. Sistema marca o agendamento com **aviso in-app permanente** ("Agendamento alterado — clique para atualizar seu calendário").
6. Cliente clica no push OU abre o app e vê o aviso.
7. Cliente vê o resumo da alteração (data antiga → nova).
8. Cliente clica em "Atualizar calendário" → sistema baixa o `.ics` no dispositivo.
9. Calendário nativo (iOS/Android) reconhece o UID e pergunta "Atualizar evento existente?".
10. Cliente confirma; evento no calendário dela é atualizado.
11. Aviso in-app do agendamento some (cliente "reconheceu" a alteração).

## Passo a passo (cancelamento pelo salão)

1. Salão cancela o agendamento pelo painel (ver [cancelamento pelo salão](../salao/08-cancelamento.md)).
2. Sistema gera `.ics` de cancelamento (`METHOD:CANCEL`, mesmo UID).
3. Push PWA para a cliente: "Seu agendamento de [data/hora] foi cancelado pelo salão".
4. Aviso in-app permanente.
5. Cliente vê o aviso; opcionalmente clica em "Remover do calendário" → `.ics` de cancelamento baixado → calendário nativo remove o evento.
6. Cliente acessa a lista de agendamentos e vê o estado `Cancelado`.
7. (Se aplicável) Regras específicas de reembolso do sinal em cancelamento pelo salão — ver dúvidas em aberto.

## Variações

- **Cliente ativou PWA push:** recebe notificação em cima da hora da alteração.
- **Cliente NÃO ativou PWA push:** só descobre ao abrir o app; aviso in-app garante que ela veja.
- **Cliente NÃO adicionou ao calendário:** botão "Atualizar/Remover calendário" ainda aparece, mas o clique não faz efeito prático — o aviso in-app pode ser dispensado direto.
- **Cliente clica no push mas está offline:** push abre o app, sistema mostra dado localmente disponível; download do `.ics` requer rede.
- **Múltiplas alterações no mesmo agendamento:** cada uma gera novo `.ics` com `SEQUENCE` maior; a última prevalece.

## Regras de negócio

- **Toda alteração feita pelo salão em agendamento futuro dispara notificação para a cliente.**
- **UID do agendamento é imutável.** Mesmo com remarcações, o `.ics` mantém o mesmo UID, com `SEQUENCE` incrementado — assim o calendário nativo entende que é update, não novo evento.
- **Aviso in-app permanente até "reconhecimento"** — impede que cliente perca a notícia por não ter push.
- **Cancelamento pelo salão** difere de cancelamento pela cliente: sinal pode ser devolvido (ver dúvidas em aberto).
- Se o novo horário conflita com outro agendamento da cliente, sistema deve alertar antes do salão finalizar a remarcação (ver fluxo do salão).

## Dependências

- **Remarcação/cancelamento pelo salão** — fluxo origem da alteração.
- **Geração de `.ics` com padrão iCalendar** (SEQUENCE, UID, METHOD).
- **PWA push** habilitado pela cliente (opcional).
- **Sistema de aviso in-app** (bandeirinha/alerta que persiste até ser reconhecido).

## Casos extremos (edge cases)

- **Cliente não abre o app por dias após a alteração:** push pode ter sido dispensado; aviso in-app espera. Se remarcado horário passa antes de ela ver, ela pode chegar no horário antigo (que já era). Mitigação: enviar novo push próximo à data original OU à nova data.
- **`.ics` de update chega antes de o cliente ter o original:** (ex.: ela não adicionou ao calendário) — evento pode ser criado do zero pelo `.ics` de update; comportamento aceitável.
- **Cliente removeu o evento do calendário manualmente:** `.ics` de update pode recriar o evento (calendário nativo trata como novo pelo UID). Comportamento aceito.
- **Múltiplas remarcações em curto intervalo:** apenas o último `.ics` importa; cliente pode receber múltiplos pushes ("agendamento alterado" repetido).
- **Cliente não tem email cadastrado (WhatsApp only):** entrega via push + in-app é suficiente; email não é canal do MVP.
- **iOS Safari com PWA sem push habilitado:** cliente não recebe push; só o aviso in-app funciona. Aceito.
- **Cliente compartilha dispositivo com outra pessoa:** o dono do UUID no dispositivo é a última pessoa identificada; alterações são exibidas para a identidade atual do dispositivo.

## Dúvidas em aberto

- **Reembolso do sinal em cancelamento pelo salão:** decidido no MVP? Recomendado: sim, sinal deve ser reembolsado (foi decisão do salão, não da cliente). Precisa desenhar como (via gateway? crédito?).
- **Cliente pode "aceitar/recusar" uma remarcação?** MVP: não — o salão decide, cliente é comunicada. Se ela discordar, contata o salão via WhatsApp e cancela ou remarca novamente.
- **Cliente perde a notificação e chega no horário antigo:** política? Salão trata pessoalmente. Sistema não protege esse caso.
- **Formato do link/deep link do push:** precisa definir schema para abrir direto no agendamento alterado.
