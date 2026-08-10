# Notas e Lembretes

Duas entidades separadas com semânticas próprias: **`nota`** é uma observação cronológica sem prazo, feita pelo salão sobre uma cliente ou um agendamento. **`lembrete`** é uma tarefa futura do salão, com data alvo, status e origem (manual ou automática por manutenção de procedimento).

---

## `nota`

### Responsabilidade

Registra uma observação livre feita pelo salão sobre uma cliente ou um agendamento específico. Não tem data alvo, não notifica, não tem estado — é só um registro cronológico que aparece na ficha da cliente e no detalhe do agendamento correspondente.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `cliente_id` | UUID | Sim | Cliente à qual a nota se refere. |
| `agendamento_id` | UUID | Não | Agendamento específico (opcional; quando presente, também aparece no detalhe do agendamento). |
| `texto` | string | Sim | Conteúdo da nota. |
| `autor_id` | UUID | Sim | `usuario_salao` que escreveu. |
| `criada_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Pertence a 1 `cliente`.
- Pode pertencer a 1 `agendamento` (opcional).

### Features relacionadas

- [Lembretes Internos](../features/lembretes-internos.md)
- [Gestão de Clientes e Histórico](../features/gestao-clientes.md)

### Observações

- **Não notifica.** É apenas persistência.
- **Escopo cliente** é obrigatório para que a nota apareça na ficha; o vínculo com agendamento é opcional.

---

## `lembrete`

### Responsabilidade

Representa uma tarefa futura do salão relacionada a uma cliente. Pode ser criada automaticamente ao concluir um atendimento com `periodo_manutencao_dias` configurado, ou manualmente pelo salão. No dia alvo, o salão é notificado (in-app + push PWA); a decisão de contatar a cliente é sempre humana.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `cliente_id` | UUID | Sim | Cliente a que se refere. |
| `agendamento_id` | UUID | Não | Agendamento de origem (obrigatório quando `origem = automatica`). |
| `procedimento_id` | UUID | Não | Procedimento de origem (útil para lembretes automáticos). |
| `texto` | string | Sim | Descrição do lembrete. |
| `data_alvo` | date | Sim | Data em que o salão deve ser notificado. |
| `origem` | origem_lembrete | Sim | Como o lembrete foi criado. |
| `status` | status_lembrete | Sim | Estado do lembrete. |
| `autor_id` | UUID | Não | `usuario_salao` que criou (null para `origem = automatica`). |
| `criado_em` | timestamp | Sim | Data de criação. |
| `concluido_em` | timestamp | Não | Momento em que foi marcado como concluído. |

### Relacionamentos

- Pertence a 1 `cliente`.
- Pode pertencer a 1 `agendamento` (obrigatório para automáticos).
- Pode referenciar 1 `procedimento`.

### Features relacionadas

- [Lembretes Internos](../features/lembretes-internos.md)
- [Gestão de Procedimentos](../features/gestao-procedimentos.md) (`periodo_manutencao_dias`)
- [Gestão de Agendamentos](../features/gestao-agendamentos.md) (conclusão dispara lembrete automático)

### Observações

- **Só o salão é notificado** — o MVP não envia mensagem automática para a cliente.
- **Editar `data_alvo`** cobre o caso de snooze; snooze rápido dedicado fica fora do MVP.
- **Recorrência** fica fora do MVP.
- **Templates de mensagem** e **compartilhamento entre usuários** ficam para o futuro multi-usuário.

---

## Enums

### `origem_lembrete`

| Valor | Significado |
|---|---|
| `automatica` | Criado pelo sistema ao concluir um atendimento cujo procedimento tem `periodo_manutencao_dias` configurado. |
| `manual` | Criado explicitamente por um `usuario_salao` (na ficha da cliente ou no detalhe de um agendamento). |

### `status_lembrete`

| Valor | Significado |
|---|---|
| `ativo` | Aparece na aba de lembretes; será notificado na `data_alvo`. |
| `concluido` | Salão marcou como concluído (antes ou depois da data alvo); sai da lista ativa. |
