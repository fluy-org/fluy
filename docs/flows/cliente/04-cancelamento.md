# Cliente — Cancelamento de agendamento

## Objetivo

Permitir que a cliente cancele um agendamento futuro pelo próprio app, com clareza de que o sinal pago não é reembolsado, liberando o slot para outras clientes imediatamente.

## Passo a passo

1. Cliente identificada acessa a lista de seus agendamentos ativos.
2. Cliente seleciona um agendamento com estado `Agendado` (não pode cancelar agendamento passado ou já concluído).
3. Sistema exibe os detalhes do agendamento.
4. Cliente clica em **Cancelar**.
5. Sistema exibe **confirmação explícita**: "Ao cancelar, o sinal pago (R$ X) não será devolvido. Deseja continuar?"
6. Cliente confirma.
7. Sistema altera o estado do agendamento para `Cancelado`.
8. Sistema libera o slot imediatamente (fica disponível para outras clientes).
9. Sistema notifica o salão (in-app + push PWA): "Cliente [Nome] cancelou o agendamento de [data/hora]".
10. Sistema exibe confirmação à cliente e atualiza a lista de agendamentos.

## Variações

- **Sucesso:** cancelado, slot liberado, sinal retido com o salão, salão notificado.
- **Cliente desiste na confirmação:** agendamento permanece intacto.
- **Cliente tenta cancelar agendamento já passado/concluído/cancelado/no-show:** botão não aparece ou é bloqueado.
- **Cancelamento durante estado `Reservado` (antes do pagamento):** simplesmente descarta a reserva; nem chega a virar "cancelamento" com sinal retido, porque não houve pagamento.

## Regras de negócio

- **Sinal não é devolvido em nenhuma hipótese de cancelamento pela cliente** (regra decidida no MVP).
- **Não há prazo mínimo de antecedência para cancelar pelo app** — cliente pode cancelar até segundos antes do horário; consequência (perder o sinal) já é conhecida.
- **Cliente NÃO pode remarcar sozinha pelo app.** Para trocar data/hora, cliente precisa contatar o salão via WhatsApp, e o salão faz a remarcação no painel (ver [remarcação pelo salão](../salao/09-remarcacao.md)).
- **Slot é liberado imediatamente** após confirmação do cancelamento.
- Cancelamento é **irreversível** — para reagendar, cliente inicia novo fluxo de agendamento.

## Dependências

- **Existência de agendamento ativo** com estado `Agendado`.
- **Identificação da cliente** (fluxo de retorno) para acessar seus agendamentos.
- **Sistema de notificação para o salão**.
- **Cálculo de disponibilidade** (que passa a considerar o slot livre novamente).

## Casos extremos (edge cases)

- **Cliente cancela e salão já está atendendo:** salão vê notificação de cancelamento em cima do horário; provavelmente aciona a cliente por WhatsApp. Modelo aceita (o sistema apenas reflete a ação da cliente).
- **Cliente cancela ao mesmo tempo que o salão remarca:** race condition; o que chegar primeiro no servidor vence. Se o cancelamento chegou primeiro, a remarcação do salão retorna erro "agendamento já não existe". Se a remarcação chegou primeiro, o cancelamento cancela o agendamento no novo horário.
- **Cliente cancela sem ter identificação válida (UUID limpo):** ela não consegue ver a lista de agendamentos; precisa contatar salão via WhatsApp. Ver dúvida em aberto.
- **Cliente tenta cancelar exatamente no minuto do horário agendado:** ainda permitido (não há prazo de bloqueio); vira cancelamento normal.
- **Cliente com múltiplos agendamentos ativos:** cancela um de cada vez, cada um segue seu próprio fluxo.
- **Slot liberado é imediatamente tomado por outra cliente:** modelo aceito; cliente que cancelou não tem prioridade se voltar atrás.
- **Cliente cancela um agendamento manual (criado pelo salão sem sinal):** funciona igual, mas não há sinal a reter. Estado vira `Cancelado`.

## Dúvidas em aberto

- **Como cliente cancela se limpou o dispositivo (perdeu UUID)?** Hoje: tem que falar com o salão via WhatsApp e o salão cancela pelo painel. Vale ter um fluxo de "recuperar acesso" via código enviado por WhatsApp? Fora do MVP.
- **Comunicação do cancelamento à cliente após confirmação:** só a UI mostra? Envia push PWA? Envia email? MVP: só UI + salão notificado.
- **Log de cancelamentos para gestão do salão:** por enquanto salão vê no histórico da cliente + no faturamento (seção "sinais retidos por cancelamento"). Suficiente para MVP.
- **Cancelamento parcial** (ex.: agendamento com múltiplos procedimentos): fora do MVP (só 1 procedimento por agendamento).
