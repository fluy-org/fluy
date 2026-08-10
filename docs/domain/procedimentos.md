# Procedimentos

O catálogo de serviços que um salão oferece. Cada procedimento carrega o que é essencial para a agenda (duração), para a cobrança (preço + sinal) e para automações pós-atendimento (período de manutenção).

---

## `procedimento`

### Responsabilidade

Representa um serviço oferecido pelo salão. É consumido pela cliente no fluxo de agendamento (catálogo público) e congelado em cada `agendamento` que o utiliza (para proteger o histórico de alterações futuras no catálogo).

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `salao_id` | UUID | Sim | Salão dono do procedimento. |
| `nome` | string | Sim | Nome exibido à cliente. |
| `descricao` | string | Não | Descrição pública. |
| `info_pre_procedimento` | string | Não | Orientações específicas do procedimento exibidas à cliente na tela de confirmação (ex.: "não lavar o cabelo 24h antes"). |
| `duracao_min` | int | Sim | Duração estimada em minutos (inclui buffer de preparo/limpeza). |
| `preco` | decimal | Sim | Preço total do procedimento. |
| `tipo_sinal` | tipo_sinal | Sim | Como o valor do sinal é interpretado. |
| `valor_sinal` | decimal | Sim | Percentual (0–100) ou valor absoluto conforme `tipo_sinal`. |
| `periodo_manutencao_dias` | int | Não | Dias sugeridos para lembrete de manutenção pós-atendimento. |
| `ativo` | boolean | Sim | Inativos não aparecem para a cliente (mas continuam disponíveis para agendamento manual pelo salão). |
| `criado_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Pertence a 1 `salao`.
- Usado em N `agendamento` (valores são congelados no agendamento no momento da criação).
- Possui 0 ou 1 `imagem_procedimento` (ver [anexos.md](./anexos.md)).

### Features relacionadas

- [Gestão de Procedimentos](../features/gestao-procedimentos.md)
- [Gestão de Agendamentos](../features/gestao-agendamentos.md) (consumo)
- [Lembretes Internos](../features/lembretes-internos.md) (`periodo_manutencao_dias`)

### Observações

- **Não há exclusão dura** — apenas inativação (`ativo = false`), preservando histórico.
- **Preço zero** é aceito (procedimento de cortesia); nesse caso `valor_sinal` também é zero.
- **Alterações no catálogo não afetam agendamentos existentes** — cada agendamento carrega cópia dos valores.
- **Categorias/agrupamento** ficam fora do MVP.
- **Um procedimento por agendamento** no MVP (combos são cadastrados como procedimento único).

---

## Enums

### `tipo_sinal`

| Valor | Significado |
|---|---|
| `percentual` | `valor_sinal` é interpretado como percentual (0–100) do `preco`. |
| `fixo` | `valor_sinal` é interpretado como valor absoluto em reais. |
