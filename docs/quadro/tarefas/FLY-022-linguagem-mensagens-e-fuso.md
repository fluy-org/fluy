# FLY-022 · Linguagem, mensagens de erro e datas no fuso do salão

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Transversal: schema compartilhado, interceptor e filtro de erros, textos do frontend |
| **Origem** | Auditoria |
| **Relacionadas** | FLY-009, FLY-011, FLY-012, FLY-013, FLY-014, FLY-016, FLY-018, FLY-019 |

## Descrição

Os tickets de cada tela citam textos pontuais. Aqui ficam as **causas comuns**, que precisam ser resolvidas uma vez só.

### 1. Mensagens de validação em inglês

- O Zod 4 não está configurado em português: não há `z.config(z.locales.pt())` no projeto.
- Os schemas também não passam mensagem própria para campos obrigatórios.
- Resultado: a dona vê mensagens como:
  - "Invalid input: expected number, received null" (procedimento, regras do salão);
  - "Too small: expected string to have >=1 characters" (chave Pix).
- Exemplos de origem: `shared/schema/src/procedimento/procedimento.schema.ts:26-36` e `shared/schema/src/configuracao_salao/configuracao_salao.schema.ts:4-7, 47-54`.

### 2. Erros técnicos do servidor chegam à tela

- O interceptor mostra `messages[0]` da API (`frontend/src/app/core/interceptors/api-error.interceptor.ts:22-41`).
- Em erro 500, o filtro manda "Internal Server Error", que aparece para o usuário.
- Erros de validação do backend chegam como "chave: Too small: expected…", com o nome técnico do campo como prefixo (`backend/src/shared/filters/all-exceptions.filter.ts:21-22, 92-96, 109-114`).

### 3. Formulários mostram só o primeiro erro, longe do campo

O padrão `issues[0]` aparece num parágrafo no fim do formulário, em vários lugares:

- `formulario-procedimento.component.ts:157-163`;
- `formulario-cliente.component.ts:84-90`;
- `disponibilidade.page.ts:186-193`;
- `configuracao.page.ts:234-237`.

### 4. Jargão e termos internos

| Termo atual | Onde aparece | Sugestão |
| --- | --- | --- |
| "No-show", "Marcar no-show", "No-shows" | `estado-agendamento.ts:56-60`, `agenda-data.ts:187-191`, `confirmacao-falta.component.html:2,50`, `faturamento-data.ts:377`, `metricas-cliente.component.html:20` | "Não compareceu" / "Falta" / "Faltas" |
| "Este estado não permite nenhuma ação." | `agendamento-detalhe.page.html:89` | Card de desfecho ([FLY-016](./FLY-016-detalhe-do-agendamento.md)) |
| "Só é possível concluir um agendamento confirmado." | backend de agendamento | "Só agendamentos com status Agendado podem ser concluídos." (o estado visível é "Agendado") |
| "Confirme as exceções do horário antes de…" | backend de agendamento | "Confirme o encaixe fora do horário de atendimento." |
| "Janela(s)", "override" | `janela_semanal.schema.ts`, `override_disponibilidade.schema.ts`, `disponibilidade.validator.ts` | "Horário", "período", "dia especial" |
| "formato YYYY-MM-DD" | `lembrete.schema.ts:11-13`, `disponibilidade.validator.ts:51` | "Escolha uma data válida." |
| "DDI" | `whatsapp.schema.ts:36` | Ver [FLY-008](./FLY-008-campo-de-whatsapp.md) |
| "Subdomínio", "Clerk", "titularidade", "homologação" | onboarding, concluir cadastro, configurações | Ver FLY-007, FLY-010, FLY-009 |
| "Ticket médio" | faturamento | "Valor médio por atendimento" |
| "MiB" | formulário de procedimento | "MB" |
| "America/Sao_Paulo" | `seletor-periodo.component.html:67` | "Horário de Brasília" |
| Valores de enum crus ("cpf", "aleatoria", "sinal", "total") | configurações, checkout | Rótulos legíveis |
| "A cliente já possui este procedimento agendado neste dia." (mostrado à própria cliente) | `agendamento.service.ts:279-288` | Mensagens distintas para o salão e para a cliente |

**Acentos faltando** em vários textos: login, concluir cadastro, procedimentos, dias da semana na disponibilidade. Os tickets de cada tela listam as ocorrências.

**Nomes das formas de pagamento diferentes entre telas.** Ver [FLY-018](./FLY-018-faturamento.md).

### 5. Datas e horas fora do fuso do salão

A regra do `CLAUDE.md` exige helper e pipe únicos para exibir instantes no fuso do salão. Dois lugares não seguem a regra e usam o fuso do aparelho:

- a mensagem "Agendamento criado para…" (`agendamento-manual.page.ts:95-98`);
- `formatarData` da central de avisos (`central-avisos.component.ts:366-371`).

Não existe um util compartilhado que converta o identificador do fuso em rótulo legível. O mapa só existe em `features/salao/onboarding/onboarding.data.ts`.

## Comportamento esperado

- **Português sempre.** Nenhuma mensagem em inglês chega ao usuário, nem do front nem do back.
- **Erro de servidor amigável.** Um erro 500 mostra "Algo deu errado do nosso lado. Tente novamente em instantes."
- **Erro no campo certo.** O erro de validação aparece no campo correspondente, com todos os campos inválidos destacados, e a tela rola até o primeiro.
- **Vocabulário único.** Os termos seguem um glossário de produto e são os mesmos em todas as telas.
- **Fuso do salão.** Toda data e hora de instante é exibida no fuso do salão, pelo pipe ou helper único.
- **Fuso legível.** O fuso aparece com nome legível.

## O que precisa ser feito

### Schema compartilhado

- Configurar o idioma pt do Zod num ponto de entrada comum ao front e ao back.
  - Exemplo: um `zod-config.ts` exportado por `@fluy/schema` e importado no bootstrap dos dois.
  - Respeitar a regra de dependências do pacote: só `zod`.
- Revisar os schemas com campos obrigatórios numéricos para mensagens específicas.

### Backend

- No filtro de exceções, não prefixar a mensagem com o path técnico.
- Para status ≥ 500, devolver uma mensagem padrão.
- Revisar as mensagens de domínio da tabela acima.

### Frontend

**Interceptor:**

- Para status ≥ 500 ou erro de rede, usar mensagens padrão em pt-BR.

**Erros por campo:**

- Criar um util compartilhado que mapeia `issue.path` para os controles (`setErrors`), alimentando o `errorText` do Ionic ou o `app-field-error`.
- Aplicar nos formulários listados na seção 3.

**Glossário:**

- Criar um glossário curto em `docs/` (por exemplo `docs/domain/glossario-interface.md`) com os termos de interface aprovados.
- Aplicar a substituição de "no-show" e dos demais termos da tabela.

**Fuso:**

- Corrigir os dois pontos fora do fuso do salão, usando o pipe `horaSalao` ou o helper correspondente.
- Mover o mapa de rótulos de fuso para `shared/utils` e usar no faturamento e no onboarding.

## Critérios de conclusão

- [ ] Deixar qualquer campo obrigatório vazio, em qualquer formulário, mostra uma mensagem em pt-BR no próprio campo.
- [ ] Simular um erro 500 mostra uma mensagem amigável.
- [ ] Nenhuma tela mostra "No-show", "janela", "override", "YYYY-MM-DD", "DDI", "Clerk" ou um identificador de fuso.
- [ ] O glossário de interface existe em `docs/`.
- [ ] As datas da mensagem de novo agendamento e da central de avisos respeitam o fuso do salão.
