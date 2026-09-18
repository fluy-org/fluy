# Salão — Cancelamento de agendamento pelo salão

## Objetivo

Permitir que o salão cancele um agendamento (por motivo próprio: doença do profissional, imprevisto, encaixe conflitante), liberando o slot e comunicando a cliente.

## Passo a passo

1. Salão abre o agendamento em `Agendado`.
2. Clica em **Cancelar**.
3. Sistema exibe modal:
   - Motivo (opcional; texto livre para registro interno)
   - Escolha de tratamento do sinal (ver "Regras de negócio")
   - Aviso: "Cliente será notificada"
4. Salão confirma.
5. Sistema:
   - Altera estado do agendamento para `Cancelado`.
   - Libera o slot imediatamente.
   - Aplica a política de sinal conforme escolha do salão.
   - Envia notificação à cliente (push PWA + aviso in-app) e gera `.ics` de cancelamento (ver [notificação de alteração](../cliente/05-notificacao-alteracao.md)).
6. Agendamento aparece como `Cancelado` no histórico.

## Variações

- **Cancelamento com reembolso de sinal:** salão devolve valor (via gateway ou combinação manual); registro reflete "sinal reembolsado".
- **Cancelamento com sinal retido:** só faz sentido se cliente concordou (raro; salão fez algo justo/mutual). Precisa registro.
- **Cancelamento de agendamento em `Reservado` (cliente ainda não pagou):** simplesmente descarta a reserva; não há sinal.
- **Cancelamento de agendamento passado (a título de correção):** permitido para ajustar registros; considerar auditoria.

## Regras de negócio

- **Diferente do cancelamento pela cliente**, cancelamento pelo salão normalmente resulta em **reembolso do sinal** (é decisão do salão, não da cliente).
- **Tratamento do sinal — decisão adiada:** MVP precisa definir se sistema oferece "reembolso automático via gateway" ou "reembolso manual" (salão trata fora do sistema).
- **Slot é liberado imediatamente** após o cancelamento.
- **Cliente é sempre notificada.**
- **Motivo do cancelamento é apenas para registro interno do salão**; NÃO é exibido para a cliente (para evitar constrangimentos).
- **Cancelamento é irreversível** — para reagendar, cliente e salão negociam via WhatsApp e criam novo agendamento (manual ou pelo fluxo digital).
- **Cancelamento de agendamento passado rebate no período atual do faturamento**, nunca reabre um período já fechado: o que vale é a data do `evento_agendamento`, não a de `inicio_em`. Mesma regra da conclusão.

## Dependências

- **Sistema de gestão de agenda.**
- **Integração com gateway de pagamento** (para reembolso automático, se implementado).
- **Sistema de notificação para a cliente** (push + `.ics` de cancelamento).
- **Faturamento** (cancelamento pelo salão pode gerar linha específica; ver dúvidas).

## Casos extremos (edge cases)

- **Salão cancela minutos antes do horário:** cliente pode já estar a caminho; notificação em tempo real é crítica.
- **Cliente já em `Reservado` (não pagou ainda):** cancelamento salão descarta a reserva; equivale a nunca ter existido.
- **Salão tenta cancelar agendamento já concluído/cancelado/no-show:** ação bloqueada (estado terminal).
- **Cliente cancela e salão cancela ao mesmo tempo (race):** o que chegar primeiro vence; segundo recebe erro "já cancelado".
- **Salão cancela mas gateway falha no reembolso:** agendamento fica `Cancelado`, sinal fica "reembolso pendente" (precisa fluxo de retry).
- **Cancelamento em massa** (ex.: salão fecha por 3 dias): fora do MVP; salão precisa cancelar um a um.
- **Cliente não tem PWA push ativo:** só vê ao abrir o app; risco de aparecer no dia sem saber.

## Dúvidas em aberto

- **Política padrão de reembolso pelo salão:** sempre reembolsa? Salão configura? MVP: recomendo "sempre reembolsa por padrão, salão pode desmarcar em casos específicos".
- **Reembolso automático via gateway ou manual:** decisão depende do gateway escolhido. Adiada com discussão do gateway.
- **Registro do cancelamento pelo salão no faturamento:** deve aparecer? Como? Se houve reembolso, não gera receita; se sinal retido, gera receita. Precisa distinguir de cancelamento pela cliente. (O **período** em que cai já está decidido — ver "Regras de negócio".)
- **Cliente pode "aceitar/recusar" o cancelamento?** Não faz sentido — cancelamento é decisão do salão. Mas cliente pode pedir compensação (crédito, remarcação prioritária) fora do sistema.
- **Notificar cliente múltiplas vezes** se ela não abrir o push (ex.: repetir 1h depois)? Fora do MVP.
