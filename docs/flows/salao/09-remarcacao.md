# Salão — Remarcação de agendamento

## Objetivo

Permitir que o salão mova um agendamento existente para outra data/horário (a pedido da cliente via WhatsApp ou por conveniência operacional), liberando o slot antigo, ocupando o novo, e mantendo o sinal já pago.

## Passo a passo

1. Salão abre o agendamento em `Agendado`.
2. Clica em **Remarcar**.
3. Sistema exibe seletor de nova data/hora:
   - Mostra disponibilidade real (janelas + agendamentos existentes).
   - Considera a mesma duração do procedimento original.
4. Salão escolhe novo horário.
5. Sistema valida:
   - Slot livre no novo horário.
   - Novo horário respeita janelas de disponibilidade.
   - Novo horário não conflita com outros agendamentos.
6. Sistema exibe confirmação:
   - "Vai remarcar de [antigo] para [novo]. Cliente será notificada."
7. Salão confirma.
8. Sistema:
   - Atualiza o agendamento (mesmo ID, mesmo UID do `.ics`, mas nova data/hora).
   - Incrementa o `SEQUENCE` do `.ics` para gerar um update.
   - Libera o slot antigo imediatamente.
   - Ocupa o novo slot.
   - Envia notificação à cliente com `.ics` de update (ver [notificação de alteração](../cliente/05-notificacao-alteracao.md)).
   - Registra a remarcação no histórico do agendamento.

## Variações

- **Remarcação simples** (só mover data/hora): mais comum.
- **Remarcação para outro procedimento** (ex.: cliente quer trocar corte por escova): fora do MVP; se necessário, cancelar e criar novo.
- **Múltiplas remarcações no mesmo agendamento:** cada uma gera novo `.ics` com `SEQUENCE` maior.
- **Slot alvo tem `Reservado` pendente:** sistema bloqueia (respeita a reserva).
- **Salão desiste antes de confirmar:** nada muda.
- **Cliente cancela ao mesmo tempo que salão remarca (race):** o que chegar primeiro vence; segundo recebe erro.

## Regras de negócio

- **Sinal já pago é mantido** e vale para o novo agendamento.
- **Não é criado novo agendamento** — o mesmo ID/UID é atualizado (importante para o `.ics` de update funcionar).
- **Remarcação preserva:** cliente, procedimento, duração, sinal pago, valor pendente, imagens de referência, notas.
- **Muda apenas:** data, hora, slot ocupado.
- **Cliente é sempre notificada.**
- **Slot antigo é liberado imediatamente**; slot novo é ocupado imediatamente.
- **Cliente NÃO pode remarcar sozinha pelo app** (decisão MVP) — precisa pedir ao salão via WhatsApp.

## Dependências

- **Cálculo de disponibilidade** (para oferecer horários válidos).
- **Sistema de notificação à cliente** com `.ics` de update.
- **Histórico do agendamento** (registrar remarcações para auditoria).
- **Fluxo de cancelamento pela cliente** (para lidar com race).

## Casos extremos (edge cases)

- **Novo horário está fora da janela de disponibilidade:** bloquear ou permitir override? Recomendo permitir override com aviso (encaixe fora do horário é caso real).
- **Novo horário ultrapassa fim da janela:** mesma decisão.
- **Novo horário cai em data com override "sem atendimento":** bloquear ou permitir com aviso? Recomendo bloquear (foi decisão consciente do salão de fechar).
- **Cliente muda de WhatsApp entre agendamento e remarcação:** notificação vai pro WhatsApp cadastrado no momento do agendamento (não muda automaticamente).
- **Salão remarca para o mesmo horário** (sem mudança real): validação bloqueia ou aceita como no-op.
- **Salão remarca para o passado:** bloquear (não faz sentido); exceção: correção de dados.
- **Cliente já adicionou o evento ao calendário e agora precisa atualizar:** ver fluxo de [notificação de alteração](../cliente/05-notificacao-alteracao.md).
- **Múltiplas remarcações em curto período:** cliente recebe múltiplos pushes; `SEQUENCE` incrementa a cada uma.

## Dúvidas em aberto

- **Salão pode remarcar em massa** (ex.: viagem de 3 dias, mover todos os agendamentos): fora do MVP; um a um.
- **Remarcação com custo/taxa:** fora do MVP; sinal apenas é preservado.
- **Cliente pode aceitar/recusar a remarcação?** MVP: não — salão decide, cliente é comunicada. Se discordar, cancela e reagenda.
- **Histórico de remarcações no card do agendamento:** exibir? Salão vê "remarcado 2 vezes"? Útil para clientes problemáticas. Sim, recomendo incluir.
