# Salão — Gestão da agenda do dia

## Objetivo

Fornecer ao salão uma visão operacional dos agendamentos do dia (ou semana), permitindo ver clientes, procedimentos, valores, imagens de referência, e disparar ações rápidas (concluir, cancelar, remarcar, marcar no-show, registrar pagamento restante).

## Passo a passo (visão principal)

1. Salão abre o painel — Home mostra por padrão os agendamentos de **hoje**.
2. Cada agendamento aparece como um card com:
   - Horário
   - Cliente (nome + link para ficha)
   - Procedimento
   - Duração
   - Status atual (`Reservado`, `Agendado`, `Concluído`, `Cancelado`, `No-show`)
   - Valor total + valor já pago + valor pendente. **"Pago" é a soma das cobranças confirmadas, não o sinal congelado do procedimento** — agendamento manual nasce em `Agendado` sem nenhum pagamento registrado, e nesse caso o pago é zero.
   - Indicador se tem imagens de referência da cliente
   - Indicador se tem observações
3. Salão pode navegar para outros dias. **Visão semanal está fora do MVP** (decidido) — a agenda nasce só diária, mobile-first.
4. Salão clica em um agendamento para ver detalhes completos.

## Passo a passo (ações rápidas em um agendamento)

Ao abrir o detalhe:

- Ver imagens de referência enviadas pela cliente.
- Ver notas/observações.
- Adicionar notas (ver [lembretes](./12-lembretes.md)).
- Adicionar anexos internos (fotos do resultado — até 3, apenas o salão vê).
- **Concluir atendimento** (ver [conclusão](./07-conclusao-atendimento.md)) — abre modal de registro do pagamento restante.
- **Cancelar** (ver [cancelamento pelo salão](./08-cancelamento.md)).
- **Remarcar** (ver [remarcação](./09-remarcacao.md)).
- **Marcar no-show** (ver [no-show](./10-no-show.md)) — só após hora + tolerância.

## Variações

- **Dia sem agendamentos:** exibe estado vazio ("Sem agendamentos hoje").
- **Agenda cheia:** todos os slots ocupados; UI destaca isso.
- **Existem `Reservado`s expirando em breve:** UI destaca (ex.: "aguardando pagamento, expira em 5min").
- **Cliente cancelou de última hora:** notificação em tempo real; card do agendamento vai para `Cancelado`.
- **Novo agendamento chegou enquanto salão olhava a agenda:** notificação em tempo real; card aparece.
- **Mudança de dia** (calendário): filtro reflete outro dia, mesma mecânica. O calendário mostra o mês inteiro com a **quantidade de agendamentos em cada dia**, para o salão enxergar a carga do mês em vez de avançar dia a dia às cegas. Tocar num dia carrega a lista dele. Isso não altera a agenda em si, que segue diária.

## Regras de negócio

- **Home padrão do salão exibe agendamentos do dia atual.**
- **Cards de agendamentos incluem estados intermediários (`Reservado`)** para o salão saber o que está "quase confirmado".
- **Salão vê tudo do dia — sem paginação de horários** (dia inteiro em uma tela).
- **Estados terminais permanecem na listagem do dia**, agrupados e com destaque reduzido, separados dos ativos (`Reservado` e `Agendado`). "Sair da agenda ativa" ao concluir, cancelar ou marcar no-show significa mudar de grupo, não desaparecer — o salão precisa ver o que já fechou no dia.
- **Apenas visão diária no MVP.** O que fica fora é renderizar os agendamentos numa **grade de horários** semanal. Um calendário mensal que mostra a contagem por dia e leva para a lista daquele dia **não** é visão semanal: os agendamentos continuam aparecendo só na lista diária, e o calendário é navegação.
- **Ações disponíveis dependem do estado**:
  - `Reservado`: apenas visualizar (aguarda pagamento).
  - `Agendado`: concluir, cancelar, remarcar, marcar no-show (a partir da hora agendada; com aviso enquanto a tolerância não expirar — ver [no-show](./10-no-show.md)).
  - `Concluído` / `Cancelado` / `No-show`: só visualizar (estados terminais).
- **Ordem de exibição:** por horário crescente.
- **Notificações em tempo real** para eventos: novo agendamento, cancelamento pela cliente, `Reservado` expirando.

## Dependências

- **Todos os fluxos de manipulação de agendamento** (criar manual, cancelar, remarcar, concluir, no-show).
- **Sistema de notificação in-app** para eventos em tempo real.
- **Cadastro de clientes** (link do card para ficha).
- **Gestão de anexos** (imagens da cliente, imagens do salão).

## Casos extremos (edge cases)

- **Múltiplos dispositivos do salão abertos simultaneamente:** cada um vê a mesma agenda; ações em um refletem em tempo real no outro (idealmente via websocket ou polling curto).
- **Salão marca no-show ANTES de expirar tolerância:** permitido, com aviso (ver [no-show](./10-no-show.md)).
- **Salão marca concluído em agendamento futuro** (dias adiante): permitido, com aviso (ver [conclusão](./07-conclusao-atendimento.md)).
- **Salão tenta cancelar um agendamento que a cliente também está cancelando (race):** o que chegar primeiro vence; segundo recebe "já cancelado".
- **Reserva expira e slot libera enquanto salão vê a agenda:** card some ou muda de estado; atualização em tempo real ideal.
- **Salão sem conexão de internet:** UI mostra "offline" e oferece nova tentativa; ações são **bloqueadas, nunca bufferizadas** (decidido). Nada fica pendente para sincronizar depois.
- **Falha ao carregar a contagem do mês no calendário:** a grade continua aberta e navegável, apenas sem o número em cada dia, com aviso e nova tentativa. Escolher um dia segue funcionando — é leitura, não ação, e a lista daquele dia tem o próprio tratamento de offline.
- **Fuso horário do dispositivo do salão diferente do fuso do salão:** exibir sempre no horário do salão (não do dispositivo).

## Dúvidas em aberto

- **Filtro por profissional** (quando multi-profissional): fora do MVP, mas UI precisa prever.
- **Impressão da agenda / export:** demanda comum em salões físicos; fora do MVP.
- **Modo "encaixe rápido"** (visualizar buracos livres do dia com destaque): útil para agenda cheia; considerar.
- **Ordenação alternativa** (por cliente, por status): fora do MVP.
