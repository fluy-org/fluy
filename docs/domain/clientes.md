# Clientes

Cadastro da cliente do salão e o mecanismo de identificação (que hoje é apenas por UUID de dispositivo, mas está preparado para receber outros métodos no futuro).

---

## `cliente`

### Responsabilidade

Representa uma cliente cadastrada no salão. É o dono do histórico de agendamentos, imagens de referência, notas e métricas. **Cada salão tem sua própria base de clientes** — a mesma pessoa que agenda em dois salões diferentes tem dois cadastros independentes.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `salao_id` | UUID | Sim | Salão dono do cadastro. |
| `nome` | string | Sim | Nome da cliente. |
| `whatsapp` | string | Sim | WhatsApp normalizado (formato internacional). Chave única dentro do salão. |
| `observacoes` | string | Não | Notas livres do salão sobre a cliente (preferências, alergias, etc.). |
| `criada_em` | timestamp | Sim | Data de criação. |
| `removido_em` | timestamp | Não | Marcação de soft delete para preservar histórico. |

### Relacionamentos

- Pertence a 1 `salao`.
- Possui N `sessao_cliente`.
- Participa de N `agendamento`.
- Recebe N `nota` e N `lembrete`.

### Features relacionadas

- [Identificação da Cliente](../features/identificacao-cliente.md)
- [Gestão de Clientes e Histórico](../features/gestao-clientes.md)

### Observações

- **WhatsApp é chave única** dentro de um mesmo salão (dois acessos com o mesmo WhatsApp = um único cadastro).
- **Edição do WhatsApp** exige confirmação e impacta o vínculo com sessões existentes.
- **Histórico permanece imutável**; exclusão de cliente é soft (`removido_em`) para preservar agendamentos passados e faturamento.
- **Merge de cadastros duplicados** fica fora do MVP (ver [README — Decisões em aberto](./README.md)).

---

## `sessao_cliente`

### Responsabilidade

Representa **uma forma de identificar a cliente**. Hoje o sistema não tem login; a identificação acontece por UUID armazenado no dispositivo. A modelagem já prevê que, no futuro, novas formas coexistirão (email/senha, Google OAuth, código enviado por WhatsApp) — cada uma vira um novo tipo de sessão. Uma cliente pode ter N sessões (multi-dispositivo, multi-método).

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `cliente_id` | UUID | Sim | Cliente identificada por essa sessão. |
| `tipo` | tipo_sessao_cliente | Sim | Método de identificação usado por essa sessão. |
| `credencial` | string | Sim | Valor da credencial (UUID, email, id externo do OAuth, etc.). Único por `tipo`. |
| `criada_em` | timestamp | Sim | Data de criação. |
| `ultimo_uso_em` | timestamp | Não | Última vez que a sessão foi resolvida. |

### Relacionamentos

- Pertence a 1 `cliente`.

### Features relacionadas

- [Identificação da Cliente](../features/identificacao-cliente.md)

### Observações

- **No MVP** todas as sessões têm `tipo = uuid_dispositivo`; a credencial é o UUID armazenado em cookie/localStorage no navegador da cliente.
- **UUID é específico ao subdomínio** (salão): a mesma cliente em dois salões tem duas sessões distintas em dois cadastros distintos.
- **Ao "agendar como outra pessoa"** o UUID do dispositivo é reescrito — corresponde a criar uma nova sessão para outra cliente, com a mesma credencial-UUID (a antiga sessão é substituída).
- **Recuperação de acesso** (cliente que perdeu o UUID) fica fora do MVP; no futuro é um novo `tipo` (`codigo_whatsapp`).
- **Validação real de identidade** (envio de código no WhatsApp) também é futura e cabe como novo `tipo`.

---

## Enums

### `tipo_sessao_cliente`

| Valor | Significado |
|---|---|
| `uuid_dispositivo` | UUID gerado pelo Fluy e armazenado no dispositivo da cliente (cookie/localStorage); único método no MVP. |

Novos tipos futuros: `email_senha`, `google_oauth`, `codigo_whatsapp` — entram como novos valores sem migração de schema.
