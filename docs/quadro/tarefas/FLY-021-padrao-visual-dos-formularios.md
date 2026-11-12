# FLY-021 · Padrão visual dos formulários: espaçamento, contraste de placeholders e selects, tema escuro

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta (afeta todas as telas e é rápido de resolver na base) |
| **Área** | Transversal: estilos globais do frontend |
| **Origem** | Teste manual do dono (selects quase invisíveis, placeholders encostados) + auditoria |
| **Relacionadas** | FLY-011, FLY-014, FLY-007, FLY-012 |

## Descrição

### 1. Placeholders e selects quase invisíveis

**Contraste dos placeholders.**

- Os placeholders de `ion-input`, `ion-textarea` e `ion-select` usam `--placeholder-color: var(--fluy-color-placeholder)`, que vale **#a09db8** (`frontend/src/theme/variables.scss:45`, `frontend/src/global.scss:153-159`).
- O Ionic aplica por cima `--placeholder-opacity: 0.6` (padrão de `@ionic/core`), e o projeto nunca sobrescreve esse valor.
- A cor efetiva fica em torno de #c4c2d4 sobre #fbfaff, com contraste ≈ 1,7:1. O WCAG pede 4,5:1.
- Isso atinge **todos** os placeholders e selects sem valor do app, por exemplo "Selecione o método" na conclusão do atendimento (`formulario-conclusao.component.html:37-41`).

**Cor do select.**

- `global.scss:156` define `--color` no `ion-select`, mas essa variável não existe no `ion-select` do Ionic 8. A regra é ignorada.
- A cor do valor selecionado é herdada (#494568, legível no tema claro), mas não é controlada pelo projeto.

**Tamanho dos selects.**

- Vários selects usam fonte de 12px, como os filtros de clientes (`clientes.page.scss`) e o seletor de procedimentos no celular (`procedimentos.page.scss`, por volta das linhas 353-355).
- O ícone (chevron) do select usa o cinza padrão do Ionic.

### 2. Tema escuro incompleto (provável causa do "select invisível")

- `variables.scss:164-227` ativa uma paleta escura por `prefers-color-scheme: dark`, mas não define `--ion-color-step-*` nem `--ion-text-color-step-*`.
- Sem essas variáveis, o Ionic usa os valores do tema claro, que ficam praticamente invisíveis sobre o fundo #1b1436:
  - ícone do select: #595959;
  - texto de apoio: #4d4d4d;
  - texto das opções do action-sheet: #262626.
- Os selects com `interface="action-sheet"`, como o de fuso no onboarding (`onboarding.page.html:62`), ficam ilegíveis em celulares com modo escuro.

### 3. Placeholder e texto encostados na borda esquerda

- Não existe estilo global de espaçamento para inputs. Cada tela faz o seu.
- `ion-input` e `ion-textarea` sem `fill` e fora de `ion-item` têm `--padding-start: 0` no Ionic.
- Algumas telas pintam `--background` e `--border-radius` sem definir padding, então o texto fica colado na borda do fundo colorido. Além disso, `--border-radius` não tem efeito sem `fill`.

**Telas afetadas (confirmado):**

- Cadastro e edição de cliente: `formulario-cliente.component.html:7-31`, `formulario-cliente.component.scss:16-22, 72-78`.
- Novo lembrete: `formulario-lembrete.component.scss:16-22`.

**Telas sem o problema:**

| Tela | Como resolve |
| --- | --- |
| Configurações | `fill="outline"` |
| Procedimentos | `--padding-start: 10px` (`formulario-procedimento.component.scss:32-42`) |
| Notas | `secao-notas.component.scss:56-64` |
| Convite | `ion-item` com padding |

**Consequência:** cada formulário tem uma aparência diferente. A classe `fluy-formulario` usada no HTML do formulário de cliente não existe em nenhum scss.

### 4. Seletores nativos inconsistentes

- Os campos `type="date"` e `type="time"` usam o seletor nativo de cada sistema, como no `seletor-horario`.
- A aparência muda entre iOS, Android e desktop.
- O calendário compartilhado é tratado na [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md).

## Comportamento esperado

**Contraste:**

- O placeholder fica com contraste de pelo menos 4,5:1 sobre o fundo do campo.
- O valor selecionado num select usa a cor do corpo de texto do tema.
- O ícone do select fica visível.

**Tamanho:** nenhum campo de formulário ou select usa fonte menor que 14px.

**Padrão único de campo**, aplicado globalmente e igual em todas as telas:

- `fill="outline"` (ou equivalente);
- espaçamento interno de 12px;
- raio, borda e cor de foco do tema.

**Tema escuro:**

- completo: textos, ícones, action-sheets e alerts legíveis;
- ou desligado até ser completado. A escolha é decisão de produto; desligar é o caminho mais rápido.

## O que precisa ser feito

### `variables.scss`

- Adicionar `--ion-placeholder-opacity: 1`.
- Escurecer `--fluy-color-placeholder` para cerca de #6f6b8c ou #797694, conferindo o contraste.

### `global.scss`

**Selects:**

- Remover o `--color` do `ion-select`.
- Usar `ion-select { color: var(--fluy-color-body); }`.
- Estilizar `ion-select::part(placeholder)` e `ion-select::part(icon)`.

**Campo padrão:** aplicado a `ion-input`, `ion-textarea` e `ion-select`.

- Opção A: `fill="outline"` em todos os formulários.
- Opção B: um bloco global com `--padding-start` e `--padding-end` de `var(--fluy-space-3)`, além de fundo, borda e raio.
- Escolher uma das duas e documentar.

### Componentes

- Remover os estilos duplicados por componente: formulário de cliente, de lembrete e de procedimento, notas e configurações.
- Remover a classe morta `fluy-formulario` ou dar a ela o papel do padrão global.
- Ajustar os selects de 12px para no mínimo 14px.

### Tema escuro

**Se for completado:**

- importar `@ionic/angular/css/palettes/dark.system.css`;
- ou definir `--ion-text-color-rgb`, `--ion-background-color-rgb` e as escalas `--ion-color-step-*` / `--ion-text-color-step-*`.

**Se for desligado:** remover o bloco `prefers-color-scheme: dark` até a paleta estar completa.

### Validação

- Registrar o padrão em `frontend/architecture.md`.
- Revisar visualmente as telas de formulário: onboarding, configurações, procedimentos, disponibilidade, clientes, lembretes, notas, novo agendamento, conclusão, checkout e identificação da cliente.

## Critérios de conclusão

- [ ] Os placeholders de todos os formulários ficam legíveis, com contraste ≥ 4,5:1, no tema claro.
- [ ] Os selects mostram o valor e o ícone com boa legibilidade no tema claro.
- [ ] Os selects também ficam legíveis no tema escuro, ou o tema escuro está desligado.
- [ ] Em nenhum formulário o texto ou o placeholder encosta na borda.
- [ ] Todos os campos seguem o mesmo visual.
- [ ] Os estilos de campo duplicados nos componentes foram removidos.
- [ ] O padrão está documentado.
