# Agendamento

O motor central do domínio. Um agendamento nasce (reservado ou já agendado), pode se mover no tempo (remarcação), e sempre termina em um de três estados terminais (`concluido`, `cancelado`, `falta`). Cada transição relevante é registrada em `evento_agendamento` para reconstruir a timeline completa.

---

## `agendamento`

### Responsabilidade

Representa a reserva de um horário de uma profissional por uma cliente para realizar um procedimento. Amarra cliente, procedimento, profissional e horário, congelando os valores financeiros no momento da criação. Sua vida é descrita pelo campo `estado` e detalhada em `evento_agendamento`.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `salao_id` | UUID | Sim | Salão dono do agendamento (redundância útil para consultas). |
| `profissional_id` | UUID | Sim | Profissional alocada. |
| `cliente_id` | UUID | Sim | Cliente do agendamento. |
| `procedimento_id` | UUID | Sim | Procedimento agendado. |
| `inicio_em` | timestamp | Sim | Início agendado (UTC; interpretado no fuso do salão). |
| `duracao_min` | int | Sim | Duração congelada do procedimento. |
| `preco_total` | decimal | Sim | Preço total congelado do procedimento. |
| `valor_sinal` | decimal | Sim | Valor do sinal congelado. |
| `estado` | estado_agendamento | Sim | Estado atual do agendamento no ciclo de vida. |
| `expira_em` | timestamp | Não | Preenchido quando `estado = reservado`; após esse instante, o agendamento é apagado se pagamento não confirmar. |
| `criado_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Pertence a 1 `salao`, 1 `profissional`, 1 `cliente`, 1 `procedimento`.
- Gera N `evento_agendamento`.
- Recebe N `pagamento_agendamento` (ver [pagamentos.md](./pagamentos.md)).
- Recebe N `anexo_agendamento` (ver [anexos.md](./anexos.md)).
- Pode receber N `nota` e N `lembrete` (ver [notas-e-lembretes.md](./notas-e-lembretes.md)).

### Estados e transições

O ciclo de vida completo (transições permitidas, quem pode transitar, condições) está descrito em [gestao-agendamentos.md — Ciclo de vida e estados](../features/gestao-agendamentos.md#ciclo-de-vida-e-estados). Resumo:

- `reservado` → `agendado` (pagamento confirmado)
- `reservado` → expira (job apaga a linha após `expira_em`)
- `agendado` → `concluido` (conclusão pelo salão)
- `agendado` → `cancelado` (cliente ou salão)
- `agendado` → `falta` (salão após `inicio_em + tolerancia`)
- `agendado` → novo `inicio_em` com mesmo `id` e `ics_uid`; `ics_sequence` incrementa (remarcação)

Estados `concluido`, `cancelado` e `falta` são terminais no MVP.

### Features relacionadas

- [Gestão de Agendamentos](../features/gestao-agendamentos.md)
- [Agenda do Dia](../features/agenda-do-dia.md)

### Observações

- **Valores são congelados no ato da criação** — alterações posteriores no procedimento não afetam agendamentos existentes.
- **Reserva expirada** é apagada por job (soft-delete opcional para telemetria/auditoria — decisão de implementação, não de domínio).
- **Múltiplos pagamentos** compõem a quitação: agendamento está quitado quando `soma(pagamento confirmado) ≥ preco_total`.
- **Fuso**: `inicio_em` é UTC no banco; exibição sempre no fuso do salão.
- **Integração com calendário** (`.ics` de convite, update e cancelamento): não persiste dado próprio no domínio. O UID iCalendar é derivado de `agendamento.id`; o `SEQUENCE` é a contagem de `evento_agendamento` com `tipo = remarcado`. Camada de integração, não de domínio.
- **Cortesia / perdão do restante** (salão marca "não vou cobrar o resto") fica fora do MVP. Quando entrar, o padrão natural é adicionar `tipo = cortesia` em `evento_agendamento` e estender a regra de quitação para "quitado se soma dos pagamentos ≥ preco_total OU existe evento cortesia".

---

## `evento_agendamento`

### Responsabilidade

Marca **quando** um agendamento atingiu um estado terminal ou foi remarcado. Existe pelos motivos concretos abaixo — não como registro geral de auditoria:

- **Faturamento** precisa da data em que o agendamento virou `cancelado`, `concluido` ou `falta` (o período em que cai é o do evento, não o de `inicio_em`).
- **`.ics` `SEQUENCE`** é a contagem de eventos `remarcado` do agendamento.
- **Histórico de remarcações** na ficha da cliente é a lista de eventos `remarcado` daquele agendamento.

Começa mínima. Novos campos (autor, payload detalhado) entram por migração aditiva quando surgir necessidade real — foi assim que `motivo` entrou, com o cancelamento pelo salão, e `cancelado_por`, com o faturamento.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `agendamento_id` | UUID | Sim | Agendamento ao qual o evento pertence. |
| `tipo` | tipo_evento_agendamento | Sim | Tipo do evento ocorrido. |
| `ocorreu_em` | timestamp | Sim | Momento do evento. |
| `motivo` | text | Não | Registro interno do salão no cancelamento. Nunca exibido para a cliente. |
| `cancelado_por` | autor_cancelamento | Não | Quem cancelou. Preenchido só em `tipo = cancelado`. O faturamento usa para distinguir o sinal retido por cancelamento da cliente do retido por cancelamento do salão. |

### Relacionamentos

- Pertence a 1 `agendamento`.

### Features relacionadas

- [Gestão de Agendamentos](../features/gestao-agendamentos.md)
- [Faturamento](../features/faturamento.md) (base temporal)
- [Gestão de Clientes e Histórico](../features/gestao-clientes.md) (rastro de remarcações)

### Observações

- **Imutável**: eventos nunca são editados ou removidos.
- **Cardinalidade por tipo:** `cancelado`, `concluido` e `falta` acontecem no máximo uma vez por agendamento (estados terminais). `remarcado` pode se repetir.
- **Tipos removidos do MVP** (podem entrar como novos valores no enum quando/se surgir necessidade): `criado` (já coberto por `agendamento.criado_em`), `pagamento_vinculado` (a existência do `pagamento_agendamento` já é o registro), `reembolso_registrado` (idem para `reembolso`), `reserva_expirada` (o agendamento simplesmente deixa de existir), `cortesia` (fora do MVP — ver observações em `agendamento`).

---

## Enums

### `estado_agendamento`

| Valor | Significado |
|---|---|
| `reservado` | Slot travado aguardando pagamento; expira automaticamente após `expira_em`. |
| `agendado` | Pagamento confirmado (sinal ou total); ocupa o slot. |
| `concluido` | Atendimento realizado; marcado manualmente pelo salão. Estado terminal. |
| `cancelado` | Cancelado pela cliente ou pelo salão. Estado terminal. |
| `falta` | Cliente não compareceu após `inicio_em + tolerancia`. Marcação manual pelo salão. Estado terminal. |

### `tipo_evento_agendamento`

| Valor | Significado |
|---|---|
| `cancelado` | Agendamento entrou em `cancelado`. |
| `concluido` | Agendamento entrou em `concluido`. |
| `falta` | Agendamento entrou em `falta`. |
| `remarcado` | Data/hora do agendamento foi alterada. |

### `autor_cancelamento`

| Valor | Significado |
|---|---|
| `cliente` | A cliente cancelou pelo portal público. |
| `salao` | O salão cancelou pelo painel. |
