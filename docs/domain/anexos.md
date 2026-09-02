# Anexos

Modela arquivos vinculados a procedimentos e agendamentos. A entidade `arquivo` guarda os dados técnicos e a propriedade do salão que realizou o upload; as tabelas de vínculo (`imagem_procedimento`, `anexo_agendamento`) representam o uso específico e a visibilidade do arquivo.

---

## `arquivo`

### Responsabilidade

Representa **um arquivo enviado ao sistema** — a coisa em si. Guarda os dados técnicos, o salão que realizou o upload e não conhece seu uso específico; esse contexto continua nas tabelas de vínculo. `salao_id` estabelece a propriedade no momento do upload e é usado para validar qualquer vínculo posterior dentro do mesmo tenant.

### Atributos principais

| Campo           | Tipo      | Obrigatório | Descrição                    |
| --------------- | --------- | ----------- | ---------------------------- |
| `id`            | UUID      | Sim         | Identificador único.         |
| `salao_id`      | UUID      | Sim         | Salão que realizou o upload. |
| `url_storage`   | string    | Sim         | URL/caminho no storage.      |
| `mime_type`     | string    | Sim         | Tipo MIME.                   |
| `tamanho_bytes` | int       | Sim         | Tamanho em bytes.            |
| `uploaded_em`   | timestamp | Sim         | Momento do upload.           |

### Relacionamentos

- Pertence a 1 `salao`.
- Pode ser referenciado por 0 ou 1 `imagem_procedimento`.
- Pode ser referenciado por 0 ou 1 `anexo_agendamento`.

### Features relacionadas

- [Anexos](../features/anexos.md)

### Observações

- **Arquivo órfão** (upload iniciado e não vinculado) é candidato natural a garbage collection — regra de implementação, não de domínio.
- **Novos usos futuros** (foto de perfil do salão, comprovante de pagamento, etc.) reaproveitam `arquivo` dentro do mesmo salão — basta uma nova tabela de vínculo, sem duplicar campos técnicos.

---

## `imagem_procedimento`

### Responsabilidade

Vincula um `arquivo` a um `procedimento` como a **imagem única** que aparece na vitrine da cliente. Cada procedimento tem no máximo uma imagem (1:1 opcional).

### Atributos principais

| Campo             | Tipo | Obrigatório | Descrição                                |
| ----------------- | ---- | ----------- | ---------------------------------------- |
| `procedimento_id` | UUID | Sim         | Procedimento dono da imagem (**único**). |
| `arquivo_id`      | UUID | Sim         | Arquivo referenciado.                    |

### Relacionamentos

- Pertence a 1 `procedimento` (1:1).
- Referencia 1 `arquivo`.

### Features relacionadas

- [Anexos](../features/anexos.md)
- [Gestão de Procedimentos](../features/gestao-procedimentos.md)

### Observações

- A imagem só pode ser vinculada a procedimento do mesmo `salao_id` do arquivo.
- **Galeria de múltiplas imagens por procedimento** fica fora do MVP.
- **Agendamentos passados perdem referência** quando salão remove a imagem — comportamento aceito (feature `anexos.md`).

---

## `anexo_agendamento`

### Responsabilidade

Vincula um `arquivo` a um `agendamento`. Cobre **os dois casos** de anexo em agendamento: imagens de referência enviadas pela cliente (visíveis para ambos) e anexos internos do salão (visíveis só para o salão). A distinção é feita por `visibilidade`.

### Atributos principais

| Campo            | Tipo               | Obrigatório | Descrição              |
| ---------------- | ------------------ | ----------- | ---------------------- |
| `id`             | UUID               | Sim         | Identificador único.   |
| `agendamento_id` | UUID               | Sim         | Agendamento associado. |
| `arquivo_id`     | UUID               | Sim         | Arquivo referenciado.  |
| `visibilidade`   | visibilidade_anexo | Sim         | Quem pode ver o anexo. |
| `criado_em`      | timestamp          | Sim         | Momento do vínculo.    |

### Relacionamentos

- Pertence a 1 `agendamento`.
- Referencia 1 `arquivo`.

### Features relacionadas

- [Anexos](../features/anexos.md)
- [Gestão de Agendamentos](../features/gestao-agendamentos.md)
- [Gestão de Clientes e Histórico](../features/gestao-clientes.md) (galerias na ficha)

### Observações

- **`visibilidade` implica o remetente** no MVP: `publica_para_cliente` = imagem enviada pela cliente; `interna_do_salao` = anexo interno do salão. Se um dia for útil rastrear quem enviou (ex.: multi-usuário do salão), entra um campo próprio sem reestruturar.
- **Limite de 3 anexos internos por agendamento** é regra de negócio (feature `anexos.md`), não constraint de schema.
- **Galeria unificada da ficha da cliente** é derivada: `anexo_agendamento` cujos agendamentos pertencem àquela cliente, filtrado por `visibilidade` conforme quem está olhando.

---

## Enums

### `visibilidade_anexo`

| Valor                  | Significado                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `publica_para_cliente` | Anexo é visível tanto para a cliente quanto para o salão (típico das imagens de referência enviadas pela cliente). |
| `interna_do_salao`     | Anexo é visível somente para o salão (típico das fotos internas do resultado do atendimento).                      |
