# Gestão de Agendamentos

## Objetivo

Cobrir o motor central do sistema: nascer, mover, encerrar (com ou sem atendimento) um agendamento, controlando o slot ocupado, o estado de vida do agendamento e a preservação de dados congelados. Esta é a capacidade que amarra a maior parte das demais.

## Usuários envolvidos

- Cliente final (cria pelo link público, cancela)
- Salão (cria manualmente, remarca, cancela, conclui, marca no-show)

## Capacidades entregues

### Ciclo de vida e estados

- Manter cada agendamento em um dos estados: `Reservado`, `Agendado`, `Concluído`, `Cancelado`, `No-show`.
- Transições permitidas:
  - `Reservado` → `Agendado` (pagamento confirmado)
  - `Reservado` → expiração (slot libera automaticamente)
  - `Agendado` → `Concluído` (conclusão pelo salão)
  - `Agendado` → `Cancelado` (cancelamento pela cliente OU pelo salão)
  - `Agendado` → `No-show` (marcação manual pelo salão após hora + tolerância)
  - `Agendado` → nova data/hora com mesmo ID (remarcação pelo salão)
- Tratar `Concluído`, `Cancelado`, `No-show` como estados terminais (irreversíveis no MVP).

### Cálculo de horários disponíveis

- Compor janelas do dia (template semanal + override) do [[gestao-disponibilidade]] com os agendamentos existentes (`Reservado` e `Agendado`).
- Oferecer horários de início conforme granularidade configurada em [[configuracao-do-salao]].
- Filtrar horários em que `hora_inicio + duracao_procedimento` ultrapassa a janela.
- Impedir procedimento que cruza duas janelas do mesmo dia.
- Aplicar antecedência mínima e máxima configuradas em [[configuracao-do-salao]].

### Criação pela cliente (fluxo público)

- Após identificação pela [[identificacao-cliente]], listar procedimentos ativos do [[gestao-procedimentos]].
- Aceitar seleção de: um procedimento, um dia, um horário de início disponível.
- Criar reserva temporária (estado `Reservado`) com timestamp de expiração conforme "prazo de reserva sem pagamento".
- Permitir anexar imagens de referência via [[anexos]].
- Encaminhar para [[pagamentos]] (sinal ou total).
- Promover reserva para `Agendado` ao confirmar pagamento (via webhook idempotente).
- Congelar no agendamento: duração, preço, sinal, dados do procedimento.
- Suportar múltiplas tentativas de pagamento dentro do prazo da reserva.
- Validar novamente disponibilidade no momento de reservar (proteção contra race e alterações do salão).

### Criação manual pelo salão

- Selecionar cliente (buscar existente por nome/WhatsApp ou criar novo via [[gestao-clientes]]).
- Selecionar procedimento (ativos + inativos com aviso — para encaixes).
- Escolher data/hora com validação de disponibilidade e conflito.
- Escolher tratamento do sinal: "sem sinal", "sinal registrado como pago" (dinheiro/manual), ou "gerar link de sinal para cliente" (usa o gateway como o fluxo público).
- Criar diretamente em `Agendado` (sem sinal ou sinal registrado como pago) OU em `Reservado` (link de sinal).
- Notificar a cliente via [[notificacoes]] como se fosse fluxo digital.
- Permitir override consciente de janela (encaixe fora do horário) — recomendado com aviso; decisão final pendente.
- Permitir criação retroativa de agendamentos passados (migração de agenda antiga) — entra direto em `Concluído`.

### Cancelamento pela cliente

- Listar apenas agendamentos em `Agendado` da própria cliente (identificada).
- Confirmar explicitamente que o sinal pago não é reembolsado.
- Transitar para `Cancelado`, liberar o slot imediatamente, notificar o salão.
- Não exigir antecedência mínima (pode cancelar até segundos antes).
- Cancelar reserva ainda não paga (`Reservado`) simplesmente descarta a reserva.

### Cancelamento pelo salão

- Aceitar motivo opcional (interno, não exibido para a cliente).
- Escolher tratamento do sinal (reembolso vs. retenção); política padrão sugerida: reembolso.
- Transitar para `Cancelado`, liberar o slot imediatamente.
- Notificar a cliente via [[notificacoes]] com `.ics` de cancelamento.
- Não permitir cancelar estados terminais.

### Remarcação pelo salão

- Oferecer seletor de nova data/hora considerando disponibilidade real e mesma duração do procedimento original.
- Manter o mesmo ID e UID; incrementar `SEQUENCE` do `.ics` para gerar update.
- Preservar cliente, procedimento, duração, sinal pago, valor pendente, imagens de referência, notas.
- Liberar slot antigo imediatamente e ocupar o novo.
- Notificar a cliente via [[notificacoes]] com `.ics` de update.
- Registrar remarcações no histórico do agendamento.
- Cliente **não** pode remarcar sozinha no MVP — precisa contatar o salão.

### Marcação de no-show

- Disponibilizar botão apenas após `hora_agendada + tolerância` (config em [[configuracao-do-salao]]).
- Confirmação exibe valor do sinal a ser retido.
- Transitar para `No-show`; sinal fica com o salão.
- Registrar no histórico da cliente em [[gestao-clientes]].
- Não gerar notificação para a cliente por padrão.

### Conclusão do atendimento

- Disponível apenas para `Agendado`.
- Modal exibe valor total, sinal pago (método), valor pendente destacado.
- Exigir registro do método de pagamento do restante via [[pagamentos]] (ou marcar "não recebeu" com aviso).
- Não existe estado "em atendimento" — vai direto de `Agendado` para `Concluído`.
- Disparar criação automática de lembrete de manutenção via [[lembretes-internos]] quando aplicável.
- Sistema não recalcula agenda com duração real.

### Concorrência

- Reservas garantem exclusividade do slot; race conditions resolvidas por "primeiro no servidor vence".
- Webhooks de pagamento devem ser idempotentes (evitar agendamento duplicado por retry).
- Cliente cancela ao mesmo tempo que salão remarca: quem chegar primeiro vence; o outro recebe erro claro.

## Documentos de referência

- fluxos/cliente/03-criacao-agendamento.md
- fluxos/cliente/04-cancelamento.md
- fluxos/salao/05-agendamento-manual.md
- fluxos/salao/07-conclusao-atendimento.md
- fluxos/salao/08-cancelamento.md
- fluxos/salao/09-remarcacao.md
- fluxos/salao/10-no-show.md

## Dependências

Depende de:
- [[identificacao-cliente]] (para criação pela cliente e cancelamento pela cliente)
- [[gestao-clientes]] (cadastros que originam agendamentos)
- [[gestao-procedimentos]] (catálogo de procedimentos)
- [[gestao-disponibilidade]] (janelas para cálculo)
- [[configuracao-do-salao]] (granularidade, prazo de reserva, tolerância, antecedências)
- [[pagamentos]] (sinal via gateway + registros manuais)
- [[notificacoes]] (avisar cliente e salão sobre criação, alteração, cancelamento)
- [[anexos]] (imagens de referência da cliente)

Usado por:
- [[agenda-do-dia]] (exibe e permite ações rápidas)
- [[gestao-clientes]] (histórico da cliente)
- [[lembretes-internos]] (criação automática ao concluir)
- [[faturamento]] (agrega concluídos + sinais retidos)

## Observações

- **Um procedimento por agendamento** no MVP.
- **Duração e preço são congelados no momento do agendamento.**
- **Cliente pode ter múltiplos agendamentos ativos simultaneamente no mesmo salão** — provavelmente permitido; confirmar em PENDENCIAS.md.
- **Reversão de conclusão / no-show** não existe no MVP; correção via suporte.
- **Cancelamento em massa** e **remarcação em massa** estão fora do MVP.
- **Registrar procedimento diferente do agendado** ao concluir é uma dúvida em aberto (ver PENDENCIAS.md).
- **Bloqueios de agenda "não-atendimento"** (ex.: "das 15 às 16 estou em reunião") devem ser tratados como override na [[gestao-disponibilidade]] no MVP.
- Race conditions críticas (dois clientes no mesmo slot, cancelar vs. remarcar) devem ser tratadas com locking no slot e webhooks idempotentes.
