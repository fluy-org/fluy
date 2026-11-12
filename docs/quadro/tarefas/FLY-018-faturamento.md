# FLY-018 · Faturamento: espaçamento, fuso legível e estado vazio único

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Painel do salão · Faturamento |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-022 · Linguagem e mensagens](./FLY-022-linguagem-mensagens-e-fuso.md) |

## Descrição

### 1. "Nenhum recebimento neste período." colado na borda

- A frase fica dentro de uma `ion-list` com borda e raio de 12px (`frontend/src/app/features/salao/faturamento/components/recebimento-por-metodo/recebimento-por-metodo.component.scss:79-87`).
- O `ion-card-content` tem `padding: 0` (linhas 71-73), e `.vazio` só tem `padding-block` (linhas 129-132). Sem espaçamento lateral, o texto encosta na borda esquerda.
- O mesmo padrão aparece em `sinais-retidos.component.scss:145-148`. Lá é menos grave, porque o card tem padding.

### 2. "Fuso do salão America/Sao_Paulo" desalinhado e com "sublinhado"

- **O "sublinhado" é um caractere.** Não é link nem `text-decoration`: é o underscore do identificador técnico do fuso, impresso cru por `{{ fusoHorario() }}` (`seletor-periodo.component.html:67`). Em fonte pequena, o "_" de "Sao_Paulo" parece um sublinhado. O próprio texto é jargão.
- **O desalinhamento vem da ordem do CSS.** As regras base `.fuso`, `.fuso ion-icon` e `.fuso-valor` (`seletor-periodo.component.scss:237-256`) vêm **depois** do `@media (max-width: 767px)` (linhas 184-235), com a mesma especificidade. No celular, elas desfazem os ajustes do mobile:
  - o ícone volta para 1.25rem em vez de 14px;
  - a borda superior e o `padding-top` voltam;
  - "America/Sao_Paulo" fica com 0.75rem, enquanto "Fuso do salão" fica com 10px.
- **Resultado:** três tamanhos de texto diferentes num flex alinhado pelo topo. Além disso, a linha ocupa a largura toda alinhada à esquerda, enquanto o período acima está centralizado.

### 3. Período sem movimento repete a mesma mensagem quatro vezes

A tela mostra, ao mesmo tempo:

- "Nenhum movimento neste período." (`faturamento.page.html:34-38`);
- os cards de resumo zerados;
- três textos vazios: recebimentos, sinais e atendimentos (`atendimentos-realizados.component.html:131-132`).

Os cards irmãos também têm estilos diferentes:

- recebimentos é transparente e sem borda (`recebimento-por-metodo.component.scss:43-49`);
- sinais retidos tem borda e sombra.

### 4. Nomes e termos inconsistentes

- A conclusão de atendimento grava "PIX" e "Cartão na máquina" (`agenda-data.ts:213-221`).
- O faturamento mostra "PIX pessoal" e "Cartão máquina" (`faturamento-data.ts:362-363`), com a origem "Manual/Online".
- "Ticket médio" é jargão.
- "No-show" aparece em `faturamento-data.ts:377`.

## Comportamento esperado

**Mensagens de lista vazia:** têm espaçamento interno e ficam centralizadas.

**Fuso:**

- Aparece como "Horário de Brasília". Os rótulos legíveis estão em `features/salao/onboarding/onboarding.data.ts:5`.
- Uma alternativa é esconder a linha quando o fuso do salão for igual ao do aparelho.
- No celular, a linha fica alinhada e com um único tamanho de texto, seguindo o alinhamento do período.

**Período sem movimento:** mostra um único estado vazio, com ilustração ou ícone e texto ("Nenhum atendimento ou pagamento neste período"). O resumo zerado é opcional, e as seções vazias ficam escondidas.

**Cards:** as seções irmãs têm o mesmo estilo.

**Nomes:**

- As formas de pagamento têm os mesmos nomes em todo o app ("Pix", "Cartão na maquininha", "Dinheiro").
- A origem é explicada ("Pago pelo app" / "Registrado por você").
- "Ticket médio" vira "Valor médio por atendimento".
- "No-show" vira "Faltas".

## O que precisa ser feito

**Mensagens de lista vazia:**

- `.vazio { padding: var(--fluy-space-4); text-align: center; }` em `recebimento-por-metodo` e `sinais-retidos`.
- Ou tirar a mensagem de dentro da `ion-list` com borda.

**Fuso:**

- Mapear o fuso para o rótulo legível, num util compartilhado (o mesmo da [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md)).
- Mover as regras base para antes do media query em `seletor-periodo.component.scss`.
- Revisar o alinhamento.

**Página de faturamento:**

- Um estado vazio único em `faturamento.page.html`.
- Esconder as seções quando o período não tiver dados.
- Uniformizar o estilo dos cards.

**Nomes:**

- Centralizar os rótulos das formas de pagamento e das origens num único mapa, usado na conclusão e no faturamento.
- Revisar os rótulos "Ticket médio" e "No-show".

## Critérios de conclusão

- [ ] As mensagens de lista vazia não encostam na borda.
- [ ] Nenhum identificador técnico de fuso aparece na tela.
- [ ] No celular, a linha do fuso fica alinhada e com tamanho uniforme.
- [ ] Um período sem movimento mostra um único estado vazio.
- [ ] As formas de pagamento têm o mesmo nome na conclusão e no faturamento.
- [ ] "Ticket médio" e "No-show" não aparecem mais.
