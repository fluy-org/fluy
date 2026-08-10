# Notificações

## Objetivo

Comunicar eventos relevantes de agendamento (criação, alteração, cancelamento, expiração) tanto à cliente quanto ao salão, através dos canais habilitados (in-app, push PWA, `.ics` de calendário), garantindo que nenhuma parte perca uma alteração crítica mesmo sem push ativo.

## Usuários envolvidos

- Cliente final (recebe push PWA + aviso in-app + `.ics`)
- Salão (recebe in-app + push PWA no painel)

## Capacidades entregues

### Notificações para a cliente

- Enviar push PWA quando cliente ativou notificações no dispositivo.
- Manter aviso in-app **persistente até "reconhecimento"** quando o salão altera ou cancela um agendamento (garante que cliente sem push também veja).
- Gerar `.ics` de calendário no ato da confirmação do agendamento (adicionar ao calendário nativo).
- Gerar `.ics` de update (`METHOD:REQUEST`, mesmo UID, `SEQUENCE` incrementado) quando salão remarca.
- Gerar `.ics` de cancelamento (`METHOD:CANCEL`, mesmo UID) quando salão cancela.
- Aceitar múltiplas alterações sequenciais no mesmo agendamento (`SEQUENCE` incremental).
- Fornecer link/deep link do push que abre direto no agendamento afetado.

### Notificações para o salão

- Push PWA e aviso in-app em tempo real para: novo agendamento, cancelamento pela cliente, reserva `Reservado` expirando em breve.
- Notificação para lembretes internos no dia alvo (ver [[lembretes-internos]]).

### Ativação e permissões

- Solicitar permissão de push PWA à cliente na tela de confirmação do agendamento (opcional).
- Suportar Safari iOS PWA (com limitações conhecidas de push).

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
- Infraestrutura de Web Push / PWA

Usado por:
- [[agenda-do-dia]] (eventos em tempo real)
- [[lembretes-internos]] (notifica salão no dia)
- [[gestao-agendamentos]] (dispara pushes/`.ics` em cada transição relevante)

## Observações

- UID do agendamento é **imutável** ao longo de remarcações — permite que o calendário nativo trate como update, não como novo evento.
- Aviso in-app permanente até reconhecimento é a proteção principal contra cliente sem push habilitado.
- Email **não é canal do MVP** para a cliente; comunicação é push + in-app + WhatsApp pessoal do salão quando necessário.
- Notificação por WhatsApp (via API oficial) está fora do MVP — depende de custo/canal.
- Múltiplos pushes em curto intervalo são aceitos; cliente pode receber "agendamento alterado" repetido.
- Não há política de repetição de push se cliente não abrir (fora do MVP).
- Schema do deep link do push precisa ser definido.
