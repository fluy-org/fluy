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
   - Valor total + sinal pago + valor pendente
   - Indicador se tem imagens de referência da cliente
   - Indicador se tem observações
3. Salão pode filtrar/mudar para outros dias ou visão semanal.
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
- **Mudança de dia** (calendário): filtro reflete outro dia, mesma mecânica.

## Regras de negócio

- **Home padrão do salão exibe agendamentos do dia atual.**
- **Cards de agendamentos incluem estados intermediários (`Reservado`)** para o salão saber o que está "quase confirmado".
- **Salão vê tudo do dia — sem paginação de horários** (dia inteiro em uma tela).
- **Ações disponíveis dependem do estado**:
  - `Reservado`: apenas visualizar (aguarda pagamento).
  - `Agendado`: concluir, cancelar, remarcar, marcar no-show (após hora + tolerância).
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
- **Salão marca no-show ANTES de expirar tolerância:** botão bloqueado até o momento certo (ou permitido com aviso — decidir).
- **Salão marca concluído em agendamento futuro** (dias adiante): permitir? Provavelmente bloquear até chegar a data, ou pelo menos alertar.
- **Salão tenta cancelar um agendamento que a cliente também está cancelando (race):** o que chegar primeiro vence; segundo recebe "já cancelado".
- **Reserva expira e slot libera enquanto salão vê a agenda:** card some ou muda de estado; atualização em tempo real ideal.
- **Salão sem conexão de internet:** UI mostra "offline"; ações bufferizadas ou bloqueadas (decidir).
- **Fuso horário do dispositivo do salão diferente do fuso do salão:** exibir sempre no horário do salão (não do dispositivo).

## Dúvidas em aberto

- **Visão semanal vs. só diária:** ambas no MVP? Só diária? Recomendo: começar com diária (mobile-first) e adicionar semanal como enhancement.
- **Filtro por profissional** (quando multi-profissional): fora do MVP, mas UI precisa prever.
- **Impressão da agenda / export:** demanda comum em salões físicos; fora do MVP.
- **Modo "encaixe rápido"** (visualizar buracos livres do dia com destaque): útil para agenda cheia; considerar.
- **Ordenação alternativa** (por cliente, por status): fora do MVP.
