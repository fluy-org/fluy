# Pagamentos

Modela todo movimento financeiro do domínio. Separa **infra de pagamento** (webhook e cobrança do gateway — reutilizáveis por qualquer feature que envolva dinheiro externo) de **domínio-específico** (a "cola" entre um agendamento e as cobranças que o cobrem). Reembolsos também têm entidade própria porque podem existir de forma independente das cobranças.

---

## `webhook_gateway_evento`

### Responsabilidade

Registra cada evento recebido do gateway de pagamento — confirmação de cobrança, reembolso confirmado, falha, etc. Serve como fonte única de verdade para eventos externos, com dedupe garantido por `id_externo` e status de processamento próprio (recebido → processando → processado / ignorado / falhou / morto).

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `id_externo` | string | Sim | ID do evento no gateway (**único**). Garante dedupe em retries. |
| `tipo_bruto` | string | Sim | Tipo informado pelo gateway (ex.: `charge.confirmed`). |
| `tipo_normalizado` | tipo_evento_gateway | Sim | Tipo normalizado pelo sistema. |
| `payload` | json | Sim | Corpo completo recebido. |
| `status` | status_webhook_gateway | Sim | Estado do processamento do evento pelo Fluy. |
| `erro_mensagem` | string | Não | Preenchido em falhas. |
| `recebido_em` | timestamp | Sim | Data do recebimento. |
| `processado_em` | timestamp | Não | Data da conclusão do processamento. |
| `atualizado_em` | timestamp | Sim | Última atualização do registro. |

### Relacionamentos

- Referencia `cobranca_gateway` indiretamente via `id_externo` (não é FK direta — pode chegar evento antes da cobrança estar registrada localmente).

### Features relacionadas

- [Pagamentos](../features/pagamentos.md)

### Observações

- **Único provider** no MVP — sem coluna `provedor`. Adição futura de multi-provider exigiria coluna.
- **Dedupe** é garantido pelo `UNIQUE(id_externo)`.

---

## `cobranca_gateway`

### Responsabilidade

Representa **uma cobrança criada no gateway de pagamento** — o objeto que corresponde a "o gateway sabe que há X reais a serem pagos por essa referência". Existe independente de qualquer agendamento; é a vinculação com o agendamento que se dá via `pagamento_agendamento`.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único interno. |
| `id_externo` | string | Sim | ID da cobrança no gateway (**único**). |
| `idempotency_key` | string | Sim | Chave gerada pelo Fluy antes de criar a cobrança (**única**); permite retry seguro em caso de timeout na criação. |
| `valor` | decimal | Sim | Valor da cobrança. |
| `metodo` | metodo_pagamento_gateway | Sim | Método usado na cobrança (depende do gateway escolhido). |
| `status` | status_cobranca_gateway | Sim | Estado atual da cobrança. |
| `criada_em` | timestamp | Sim | Data de criação no gateway. |
| `confirmada_em` | timestamp | Não | Preenchido quando `status = confirmada`. |
| `atualizado_em` | timestamp | Sim | Última atualização. |

### Relacionamentos

- Pode ser referenciada por N `pagamento_agendamento` (na prática, 1:1 no fluxo atual).
- Pode receber N `reembolso`.

### Features relacionadas

- [Pagamentos](../features/pagamentos.md)

### Observações

- **`idempotency_key`** é padrão de mercado para retentativas seguras — evita cobrança duplicada quando o Fluy chama o gateway e não recebe resposta.
- **Reembolso** aparece em entidade própria (`reembolso`), não como status intermediário aqui.
- Ver **Decisões em aberto** no [README](./README.md): a escolha do gateway (Woovi vs. Asaas) trava os métodos disponíveis.

---

## `cobranca_manual`

### Responsabilidade

Registra dinheiro que entrou **fora do gateway** — pagamento presencial (dinheiro, PIX pessoal, cartão de máquina) declarado pelo salão. Cobre tanto sinal antecipado quanto valor restante recebido na conclusão.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `valor` | decimal | Sim | Valor registrado. |
| `metodo` | metodo_pagamento_manual | Sim | Forma pela qual o dinheiro entrou fisicamente. |
| `registrada_por` | UUID | Sim | `usuario_salao` que fez o registro. |
| `registrada_em` | timestamp | Sim | Momento do registro. |

### Relacionamentos

- Pode ser referenciada por N `pagamento_agendamento` (na prática, 1:1 no fluxo atual).
- Pode receber N `reembolso`.

### Features relacionadas

- [Pagamentos](../features/pagamentos.md)

### Observações

- **`cobranca_manual` só existe quando dinheiro realmente entrou.** No MVP, "não recebi o restante" não é registrado — a pendência simplesmente permanece como valor a receber.
- **Na conclusão do atendimento**, a cobrança nasce com `valor` igual ao valor pendente no instante da conclusão (`preco_total` menos a soma das cobranças confirmadas) e `registrada_por` igual ao `usuario_salao` da requisição autenticada. A criação da cobrança, do `pagamento_agendamento` e da transição do agendamento acontece em uma única transação — ver [conclusão de atendimento](../flows/salao/07-conclusao-atendimento.md).

---

## `pagamento_agendamento`

### Responsabilidade

**Vínculo puro entre um agendamento e a cobrança que o cobre** — de gateway OU manual. Um agendamento pode ter vários (sinal + restante, por exemplo). Não carrega valor nem data próprios: essas informações vivem na cobrança referenciada.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `agendamento_id` | UUID | Sim | Agendamento coberto. |
| `cobranca_gateway_id` | UUID | Não | Cobrança de gateway referenciada. |
| `cobranca_manual_id` | UUID | Não | Cobrança manual referenciada. |
| `tipo` | tipo_pagamento_agendamento | Sim | Se a cobrança pagou o sinal ou o restante. A conclusão grava `restante`; o pagamento online do sinal grava `sinal`. |

**Regra:** exatamente um entre `cobranca_gateway_id` e `cobranca_manual_id` é preenchido (XOR).

### Relacionamentos

- Pertence a 1 `agendamento`.
- Referencia 1 `cobranca_gateway` **ou** 1 `cobranca_manual` (XOR).

### Features relacionadas

- [Pagamentos](../features/pagamentos.md)
- [Gestão de Agendamentos](../features/gestao-agendamentos.md)
- [Faturamento](../features/faturamento.md)

### Observações

- **Quitação** de um agendamento é derivada: soma dos valores confirmados das cobranças vinculadas ≥ `agendamento.preco_total`.
- **Escolha de duas FKs (XOR) em vez de FK polimórfica** preserva integridade referencial no Postgres — ver [README — Convenções](./README.md).

---

## `reembolso`

### Responsabilidade

Representa a devolução de um valor a partir de uma cobrança já confirmada — de gateway ou manual. Pode ser parcial, pode existir mais de um por cobrança (embora raro), e sempre tem seu próprio ciclo (criado → confirmado).

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `cobranca_gateway_id` | UUID | Não | Cobrança de gateway reembolsada. |
| `cobranca_manual_id` | UUID | Não | Cobrança manual reembolsada. |
| `valor` | decimal | Sim | Valor reembolsado. |
| `motivo` | string | Não | Motivo opcional (registro interno). |
| `id_externo_gateway` | string | Não | ID do estorno no gateway (só quando cobrança de origem é de gateway e o reembolso passou pelo gateway). |
| `criado_em` | timestamp | Sim | Data de criação do registro. |
| `confirmado_em` | timestamp | Não | Data em que o reembolso foi confirmado (via webhook, para gateway; imediato, para manual). |

**Regra:** exatamente um entre `cobranca_gateway_id` e `cobranca_manual_id` é preenchido (XOR — mesmo padrão de `pagamento_agendamento`).

### Relacionamentos

- Referencia 1 `cobranca_gateway` **ou** 1 `cobranca_manual` (XOR).

### Features relacionadas

- [Pagamentos](../features/pagamentos.md)

### Observações

- **Regra atual do MVP:** reembolso só faz sentido quando cliente pagou o **valor total** — a parte do sinal nunca é reembolsada (ver [gestao-agendamentos.md — Cancelamento](../features/gestao-agendamentos.md#cancelamento-pela-cliente)). Nesse caso, `reembolso.valor = pagamento_total − valor_sinal`.
- **Estrutura suporta reembolso parcial arbitrário** caso surja necessidade de negócio (ex.: salão devolve metade em acordo).
- **Reembolso manual** (dinheiro devolvido em mãos) é registrado apontando para `cobranca_manual`; não tem `id_externo_gateway`.

---

## Enums

### `tipo_evento_gateway`

| Valor | Significado |
|---|---|
| `cobranca_confirmada` | Cobrança do gateway foi paga. |
| `reembolso_confirmado` | Reembolso feito pelo gateway foi processado. |
| `falhou` | Tentativa de pagamento falhou (recusa, expiração no gateway, etc.). |

Novos valores são adicionados conforme surgirem eventos relevantes do gateway.

### `status_webhook_gateway`

| Valor | Significado |
|---|---|
| `recebido` | Webhook chegou; ainda não foi processado. |
| `processando` | Processamento em andamento. |
| `processado` | Processado com sucesso. |
| `ignorado` | Ignorado deliberadamente (tipo desconhecido, duplicata detectada, etc.). |
| `falhou` | Processamento falhou; será retentado. |
| `morto` | Falhou o número máximo de tentativas; requer investigação. |

### `metodo_pagamento_gateway`

| Valor | Significado |
|---|---|
| `pix` | Cobrança PIX via gateway. |
| `cartao` | Cobrança de cartão via gateway. |

Valores efetivos dependem do gateway escolhido (Woovi = só `pix`; Asaas = `pix` + `cartao`).

### `status_cobranca_gateway`

| Valor | Significado |
|---|---|
| `pendente` | Cobrança criada, aguardando pagamento. |
| `confirmada` | Pagamento confirmado pelo gateway. |
| `expirada` | Prazo de pagamento no gateway expirou. |
| `falhou` | Tentativa de pagamento recusada. |

### `tipo_pagamento_agendamento`

| Valor | Significado |
|---|---|
| `sinal` | Cobrança do sinal, paga antes do atendimento. |
| `restante` | Cobrança do valor restante, registrada na conclusão. |

### `metodo_pagamento_manual`

| Valor | Significado |
|---|---|
| `dinheiro` | Espécie. |
| `pix_pessoal` | PIX direto entre a cliente e o salão (fora do gateway). |
| `cartao_maquina` | Máquina de cartão física do salão. |
| `outro` | Qualquer outro método fora do gateway. |
