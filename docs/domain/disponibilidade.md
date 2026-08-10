# Disponibilidade

Entidades que definem **quando cada profissional está aberto para atendimento**. A disponibilidade efetiva de um dia emerge da combinação do template semanal com overrides pontuais.

---

## `janela_semanal`

### Responsabilidade

Define uma janela de trabalho recorrente de uma profissional em um dia da semana. Um dia pode ter zero, uma ou várias janelas (ex.: 09:00–12:00 e 14:00–18:00 para respeitar o almoço).

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `profissional_id` | UUID | Sim | Profissional dona da janela. |
| `dia_semana` | int | Sim | 0 (domingo) a 6 (sábado). |
| `hora_inicio` | time | Sim | Hora de início (fuso do salão). |
| `hora_fim` | time | Sim | Hora de fim (fuso do salão). |

### Relacionamentos

- Pertence a 1 `profissional`.

### Features relacionadas

- [Gestão de Disponibilidade](../features/gestao-disponibilidade.md)

### Observações

- Não pode haver sobreposição de janelas do mesmo dia para a mesma profissional (validação de domínio).
- Janelas que cruzam meia-noite ficam **fora do MVP**.
- Ausência de janelas em um dia = profissional não atende naquele dia.

---

## `override_disponibilidade`

### Responsabilidade

Marca que **uma data específica é uma exceção ao template semanal** de uma profissional. Serve para feriados, folgas pontuais, horários estendidos ou dias com bloqueios no meio. É o "cabeçalho" da exceção — quando o dia é aberto com horário diferente, as janelas efetivas ficam em `janela_override`.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `profissional_id` | UUID | Sim | Profissional dona do override. |
| `data` | date | Sim | Data específica sobrescrita. Combinação `(profissional_id, data)` é única. |
| `fechado` | boolean | Sim | `true` = dia inteiro fechado (ignora template e ignora `janela_override`). `false` = dia aberto com as janelas definidas em `janela_override`. |

### Relacionamentos

- Pertence a 1 `profissional`.
- Possui N `janela_override` (quando `fechado = false`).

### Features relacionadas

- [Gestão de Disponibilidade](../features/gestao-disponibilidade.md)

### Observações

- **Reverter para o template** = deletar o `override_disponibilidade`. As `janela_override` associadas caem em cascata.
- **Alterar disponibilidade não cancela agendamentos conflitantes** — o salão trata caso a caso.
- **Recorrência de override** (ex.: "toda última sexta é folga") fica fora do MVP.

---

## `janela_override`

### Responsabilidade

Representa **uma faixa contínua de trabalho em uma data com override aberto**. Mesmo formato de `janela_semanal`, mas ligada a um `override_disponibilidade` em vez de um dia da semana. Um override pode ter várias — um dia com dois turnos vira duas linhas.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `override_id` | UUID | Sim | Override ao qual pertence. |
| `hora_inicio` | time | Sim | Hora de início (fuso do salão). |
| `hora_fim` | time | Sim | Hora de fim (fuso do salão). |

### Relacionamentos

- Pertence a 1 `override_disponibilidade`.

### Features relacionadas

- [Gestão de Disponibilidade](../features/gestao-disponibilidade.md)

### Observações

- Não pode haver sobreposição de janelas dentro do mesmo override (validação de domínio).
- Só existe quando o override tem `fechado = false`. Se `fechado = true`, o override não deve ter nenhuma janela.

---

## Regra de precedência

Ao determinar as janelas efetivas de uma profissional em uma data:

1. Existe `override_disponibilidade` para `(profissional_id, data)`?
   - **Sim, `fechado = true`** → profissional não atende. Retorna vazio.
   - **Sim, `fechado = false`** → retorna as `janela_override` daquele override.
   - **Não** → retorna as `janela_semanal` daquela profissional cujo `dia_semana` corresponde à data.

O override é sempre "tudo ou nada" — quando existe e está aberto, substitui integralmente o template daquele dia; não faz merge.

---

## Como se calcula a disponibilidade de um horário

A disponibilidade de um horário para agendamento **não é uma entidade** — é um cálculo derivado. Para um determinado `salao`, `data` e `duracao_min` do procedimento escolhido:

1. Para cada `profissional` ativa do salão:
   - Determina as janelas efetivas do dia (pela regra de precedência acima).
   - Subtrai os intervalos já ocupados por agendamentos em estado `reservado` ou `agendado`.
2. O horário está disponível para a cliente se **pelo menos uma profissional** tem uma janela que comporta o intervalo `[hora, hora + duracao_min]` sem conflito.
3. A alocação ao profissional específico acontece no ato da confirmação.

Regras de negócio detalhadas do cálculo estão em [gestao-agendamentos.md — Cálculo de horários disponíveis](../features/gestao-agendamentos.md#cálculo-de-horários-disponíveis) e em [fluxos/cliente/03-criacao-agendamento.md](../fluxos/cliente/03-criacao-agendamento.md).
