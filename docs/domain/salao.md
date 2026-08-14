# Salão

Entidades que representam o tenant (o salão), quem opera dentro dele, os profissionais que atendem e os parâmetros operacionais.

---

## `salao`

### Responsabilidade

Representa um tenant do Fluy — um estabelecimento independente com sua própria base de clientes, catálogo, agenda e faturamento. Todo dado do sistema pertence direta ou indiretamente a um salão.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `nome` | string | Sim | Nome público do salão. |
| `subdominio` | string | Sim | Slug único no Fluy (`nome.fluy.app`). |
| `contato_whatsapp` | string | Sim | WhatsApp de contato exibido publicamente. |
| `endereco` | string | Sim | Endereço público. |
| `fuso_horario` | string | Sim | Fuso do salão (ex.: `America/Sao_Paulo`); base para interpretação de horas. |
| `criado_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Possui N `usuario_salao`.
- Possui N `profissional`.
- Possui 1 `configuracao_salao`.
- Possui N `procedimento`.
- Possui N `cliente`.

### Features relacionadas

- [Conta e Autenticação](../features/conta-e-autenticacao.md)
- [Configuração do Salão](../features/configuracao-do-salao.md)

### Observações

- Subdomínio é único em todo o Fluy (first-come, first-served).
- Dados fiscais (CNPJ, razão social) não fazem parte do MVP; entram quando iniciar cobrança do SaaS.

---

## `usuario_salao`

### Responsabilidade

Representa a membership de um `usuario` em um `salao`. É a referência de
autoria e de permissões dentro do tenant, mas não guarda identidade nem
credenciais.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `usuario_id` | UUID | Sim | Usuário global vinculado. |
| `salao_id` | UUID | Sim | Salão ao qual pertence. |
| `papel` | papel_usuario_salao | Sim | Papel do usuário no salão. |
| `criado_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Pertence a 1 `usuario` e a 1 `salao`.
- O par (`usuario_id`, `salao_id`) é único.

### Features relacionadas

- [Conta e Autenticação](../features/conta-e-autenticacao.md)

### Observações

- UI de convite/gestão de funcionários fica para depois do MVP.

---

## `usuario` e `identidade_autenticacao`

### Responsabilidade

`usuario` é a conta global Fluy, independente de qualquer salão.
`identidade_autenticacao` vincula essa conta a um provedor externo. No início,
o único provedor é o Clerk; senha, OAuth, sessões e verificação de e-mail são
responsabilidades desse provedor.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `usuario.id` | UUID | Sim | Identificador único da conta global. |
| `usuario.nome` | string | Sim | Primeiro nome retornado pelo Clerk. |
| `usuario.sobrenome` | string | Sim | Sobrenome retornado pelo Clerk. |
| `usuario.email` | string | Sim | E-mail primário verificado, único no Fluy. |
| `usuario.criado_em` | timestamp | Sim | Data de materialização local. |
| `identidade_autenticacao.usuario_id` | UUID | Sim | Conta global vinculada. |
| `identidade_autenticacao.provedor` | string | Sim | `clerk` no MVP. |
| `identidade_autenticacao.identificador_externo` | string | Sim | Identificador do usuário no provedor. |
| `identidade_autenticacao.criado_em` | timestamp | Sim | Data de vínculo. |

### Relacionamentos

- Um `usuario` possui N `identidade_autenticacao`.
- O par (`provedor`, `identificador_externo`) é único.

### Features relacionadas

- [Conta e Autenticação](../features/conta-e-autenticacao.md)

### Observações

- Uma identidade externa nova não pode materializar uma conta caso seu e-mail
  já pertença a outro `usuario`.
- A conta local é criada somente depois de o Clerk confirmar o e-mail primário.

---

## `profissional`

### Responsabilidade

Representa quem executa os atendimentos dentro de um salão. É a entidade cuja **disponibilidade** é medida e a quem cada **agendamento** é alocado. No MVP, cada salão tem 1 profissional (criado automaticamente no onboarding); o modelo já suporta múltiplas.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `salao_id` | UUID | Sim | Salão a que pertence. |
| `nome` | string | Sim | Nome do profissional. |
| `ativo` | boolean | Sim | Inativo não recebe novos agendamentos. |
| `criado_em` | timestamp | Sim | Data de criação. |

### Relacionamentos

- Pertence a 1 `salao`.
- Possui N `janela_semanal`.
- Possui N `override_disponibilidade`.
- Realiza N `agendamento`.

### Features relacionadas

- [Gestão de Disponibilidade](../features/gestao-disponibilidade.md)
- [Gestão de Agendamentos](../features/gestao-agendamentos.md)

### Observações

- No MVP, cliente escolhe somente procedimento + horário; sistema aloca à primeira profissional disponível em ordem determinística. Ver **Decisões em aberto** no [README](./README.md).
- **Especialidade por profissional** (quem sabe fazer o quê) fica de fora do MVP — todo profissional realiza todo procedimento. Estrutura futura: entidade N:M `profissional_procedimento`. Ver **Decisões em aberto**.

---

## `configuracao_salao`

### Responsabilidade

Guarda os parâmetros operacionais que moldam o comportamento do sistema para aquele salão (regras de reserva, tolerâncias, antecedências, mensagens exibidas à cliente). Separada de `salao` porque agrupa configurações que evoluem juntas e podem crescer sem inflar a entidade principal.

### Atributos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único. |
| `salao_id` | UUID | Sim | Salão dono da configuração (1:1). |
| `granularidade_min` | int | Sim | De quanto em quanto tempo, em minutos, os horários de início são oferecidos à cliente. Default 30 (opções em `09:00`, `09:30`, `10:00`...). Não altera a duração do procedimento — só o espaçamento das opções mostradas. |
| `prazo_reserva_min` | int | Sim | Tempo, em minutos, que um slot fica em `reservado` aguardando pagamento antes de expirar. Default 15. |
| `tolerancia_atraso_min` | int | Sim | Tempo após o `inicio_em` de um agendamento antes de o botão de marcar `falta` ficar disponível. Default 15. |
| `antecedencia_min_horas` | int | Sim | Quanto tempo antes do horário a cliente pode agendar. Default 2 (se são 14:00, primeiro horário agendável é 16:00). |
| `antecedencia_max_dias` | int | Sim | Quantos dias no futuro a cliente pode agendar. Default 60. |
| `mensagem_confirmacao` | string | Não | Mensagem personalizada do salão exibida na tela de confirmação do agendamento. |
| `politica_atraso` | string | Não | Texto de política de atraso apresentado à cliente na confirmação. |

### Relacionamentos

- Pertence a 1 `salao` (1:1).

### Features relacionadas

- [Configuração do Salão](../features/configuracao-do-salao.md)

### Observações

- Todos os horários interpretados no fuso do `salao`.
- Tolerância é global no MVP — não varia por procedimento.
- No futuro multi-profissional, alguns parâmetros podem passar a ser por profissional.

---

## Enums

### `papel_usuario_salao`

| Valor | Significado |
|---|---|
| `dono` | Dono do salão (único papel usado no MVP). |
| `funcionario` | Funcionário com acesso ao painel (previsto para o futuro; UI de convite/gestão fora do MVP). |
