# Agenda do Dia

## Objetivo

Fornecer ao salão uma visão operacional consolidada dos agendamentos, com ações rápidas contextuais e atualizações em tempo real, para conduzir o dia de atendimento sem precisar navegar entre múltiplas telas.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

- Exibir por padrão os agendamentos do dia atual como home do painel.
- Renderizar cada agendamento como card com: horário, cliente, procedimento, duração, status, valor total, sinal pago, valor pendente, indicadores de imagens de referência e observações.
- Incluir cards de agendamentos em estado `Reservado` (aguardando pagamento) para visibilidade completa.
- Ordenar cards por horário crescente.
- Filtrar/navegar para outros dias (ou visão semanal futura).
- Abrir detalhe do agendamento com ações contextuais conforme estado:
  - `Reservado`: apenas visualizar.
  - `Agendado`: concluir, cancelar, remarcar, marcar no-show (após tolerância).
  - Estados terminais: apenas visualizar.
- Destacar reservas expirando em breve.
- Receber e refletir notificações em tempo real: novo agendamento, cancelamento pela cliente, reserva expirando.
- Sincronizar em tempo real entre múltiplos dispositivos do salão abertos simultaneamente.
- Exibir sempre no fuso do salão (independente do fuso do dispositivo).
- Sinalizar estado vazio ("sem agendamentos hoje") e agenda cheia.

## Documentos de referência

- fluxos/salao/06-agenda-dia.md
- fluxos/salao/07-conclusao-atendimento.md (ação a partir do card)
- fluxos/salao/08-cancelamento.md (ação a partir do card)
- fluxos/salao/09-remarcacao.md (ação a partir do card)
- fluxos/salao/10-no-show.md (ação a partir do card)

## Dependências

Depende de:
- [[gestao-agendamentos]] (fonte dos dados e destinatária das ações)
- [[gestao-clientes]] (link do card para a ficha da cliente)
- [[configuracao-do-salao]] (fuso, tolerância que gatilha botão de no-show)
- [[anexos]] (indicadores/preview de imagens)
- [[notificacoes]] (canal de eventos em tempo real para o salão)

Usado por:
- Fluxo de trabalho diário do salão — é o hub central de operação.

## Observações

- Visão semanal está adiada — MVP começa apenas com diária, mobile-first.
- Filtro por profissional aparece no futuro multi-profissional; UI deve prever.
- Impressão/export da agenda, modo "encaixe rápido" e ordenações alternativas estão fora do MVP.
- Comportamento offline (bufferizar vs. bloquear ações) precisa ser decidido.
