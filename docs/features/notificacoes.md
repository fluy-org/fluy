# Notificações

## Objetivo

Comunicar eventos relevantes de agendamento (criação, alteração, cancelamento, expiração) tanto à cliente quanto ao salão. No MVP, os canais escolhidos são avisos in-app persistentes e `.ics` de calendário; push PWA fica como incremento futuro.

## Usuários envolvidos

- Cliente final (recebe aviso in-app + `.ics`)
- Salão (recebe aviso in-app no painel)

## Capacidades entregues

### Notificações para a cliente

- Manter aviso in-app **persistente até "reconhecimento"** quando o salão altera ou cancela um agendamento.
- Gerar `.ics` de calendário no ato da confirmação do agendamento (adicionar ao calendário nativo).
- Gerar `.ics` de update (`METHOD:REQUEST`, mesmo UID, `SEQUENCE` incrementado) quando salão remarca.
- Gerar `.ics` de cancelamento (`METHOD:CANCEL`, mesmo UID) quando salão cancela.
- Aceitar múltiplas alterações sequenciais no mesmo agendamento (`SEQUENCE` incremental).

### Notificações para o salão

- Aviso in-app para: novo agendamento, cancelamento pela cliente, reserva `Reservado` expirando em breve.
- Notificação para lembretes internos no dia alvo (ver [[lembretes-internos]]).
- Agenda e central de avisos convergem por polling curto de 15 segundos no MVP.

### Canal futuro

- Push PWA por dispositivo, permissões e suporte específico ao Safari iOS não fazem parte do MVP atual.

## Documentos de referência

- fluxos/cliente/03-criacao-agendamento.md (notificação de novo agendamento para o salão + `.ics` inicial + push opt-in)
- fluxos/cliente/04-cancelamento.md (notificação do cancelamento para o salão)
- fluxos/cliente/05-notificacao-alteracao.md (fluxo detalhado de comunicação de remarcação/cancelamento pelo salão)
- fluxos/salao/05-agendamento-manual.md (notificação de novo agendamento para a cliente)
- fluxos/salao/08-cancelamento.md
- fluxos/salao/09-remarcacao.md
- fluxos/salao/06-agenda-dia.md (eventos em tempo real na agenda)
- fluxos/salao/12-lembretes.md (notificação de lembrete no dia alvo)

## Dependências

Depende de:

- [[gestao-agendamentos]] (origem dos eventos de alteração/cancelamento/criação)
- [[identificacao-cliente]] (para saber o destinatário no dispositivo)
- Canal persistente de avisos in-app

Usado por:

- [[agenda-do-dia]] (eventos em tempo real)
- [[lembretes-internos]] (notifica salão no dia)
- [[gestao-agendamentos]] (dispara pushes/`.ics` em cada transição relevante)

## Observações

- UID do agendamento é **imutável** ao longo de remarcações — permite que o calendário nativo trate como update, não como novo evento.
- Aviso in-app permanente até reconhecimento é a proteção principal contra cliente sem push habilitado.
- Email **não é canal do MVP** para a cliente; comunicação é in-app + `.ics` + WhatsApp pessoal do salão quando necessário.
- Notificação por WhatsApp (via API oficial) está fora do MVP — depende de custo/canal.
- Push PWA, política de repetição e deep link ficam para um incremento posterior ao MVP.
