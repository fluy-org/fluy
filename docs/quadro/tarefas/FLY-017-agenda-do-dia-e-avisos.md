# FLY-017 · Agenda do dia e central de avisos: navegação, estados vazios e atalhos

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Painel do salão · Agenda · Central de avisos |
| **Origem** | Auditoria |
| **Relacionadas** | [FLY-015 · Novo agendamento](./FLY-015-novo-agendamento-pelo-salao.md), [FLY-016 · Detalhe do agendamento](./FLY-016-detalhe-do-agendamento.md), [FLY-006 · Primeiros passos](./FLY-006-primeiros-passos-do-salao.md) |

## Descrição

### Agenda (`frontend/src/app/features/salao/agenda/pages/agenda/`)

**1. O botão "Novo agendamento" fica escondido.**

- O botão fica **depois de todos os cards** (`agenda.page.html:67-74`). Num dia cheio, é preciso rolar até o fim para criar um agendamento.
- O estado vazio diz "Adicione um atendimento para começar", mas não oferece um botão ali.
- O botão não leva a data em foco. Isso é tratado na [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md).

**2. O estado vazio é igual para qualquer dia.**

- "Seu dia está livre por aqui" (`agenda.page.html:40-42`) aparece também para dias passados.
- Quando todos os agendamentos do dia estão encerrados, aparece "Ativos · 0" sem nenhum texto embaixo (`agenda.page.html:46`).

**3. A navegação entre dias é limitada.** Em `navegacao-dia.component.html`:

- não há atalho "Hoje" nem marcação do dia atual;
- a faixa de 5 dias não mostra quantos agendamentos cada dia tem;
- o mês aparece em minúscula ("novembro de 2026", `navegacao-dia.component.scss:63-66`), enquanto o calendário usa maiúscula inicial;
- o modal do calendário não tem título, botão de fechar nem "Hoje" (`agenda.page.html:78-93`).

**4. O dia selecionado fica rosa num tema roxo.**

- `calendario-mes.component.scss:74` usa `--fluy-color-primary-light`, que não existe em `theme/variables.scss`.
- Por isso vale o fallback rosa `rgba(235,75,125,.1)`, com a borda roxa.
- Também citado na [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md), que mexe no mesmo componente.

**5. Card mostra "A receber" em agendamento cancelado ou com falta.**

- O card mostra "A receber R$ X" (`agendamento-card.component.html:31-38`) para atendimentos que não vão acontecer.
- A regra de backend correspondente está na [FLY-016](./FLY-016-detalhe-do-agendamento.md).

**6. A agenda não recarrega ao voltar de outra tela.**

- `ionViewDidEnter` só reinicia o polling (`agenda.page.ts:210-212`).
- Mudanças feitas em outra tela levam até 15 s para aparecer. Isso inclui agendamentos novos e ações feitas no detalhe.

### Central de avisos (`frontend/src/app/features/avisos/components/central-avisos/`)

**7. O salão não consegue abrir o agendamento a partir do aviso.**

- "Ver agendamento" só existe quando `escopo() === "cliente"` (`central-avisos.component.html:69`).
- Um aviso como "Fulana cancelou…" não leva a lugar nenhum no painel do salão.

**8. "Marcar como visto" faz a lista inteira piscar.**

- Depois da ação, `carregar()` roda sem o modo silencioso (`central-avisos.component.ts:317`).
- A lista inteira vira um indicador de carregamento e depois volta.

**9. Não existe "Marcar todos como vistos".**

**10. As horas dos avisos usam o fuso do aparelho.** Isso está tratado na [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md).

## Comportamento esperado

**Novo agendamento:**

- Botão flutuante, sempre visível, que abre o formulário já com a data em foco.
- O estado vazio também oferece o botão.

**Estado vazio conforme o dia:**

- **Passado:** "Nenhum atendimento neste dia."
- **Hoje:** "Nenhum atendimento hoje. Compartilhe seu link para receber agendamentos", com o atalho do link da [FLY-006](./FLY-006-primeiros-passos-do-salao.md).
- **Futuro:** "Nenhum atendimento marcado ainda."

**Grupos de agendamentos:** o grupo "Ativos" não aparece quando está vazio.

**Navegação entre dias:**

- botão "Hoje";
- marcação visual do dia atual;
- quantidade de agendamentos por dia na faixa de 5 dias (um ponto ou um número);
- mês com maiúscula inicial;
- modal do calendário com título, fechar e "Hoje".

**Cores:** o dia selecionado usa a cor do tema.

**Valores:** o card não mostra "A receber" em cancelado ou falta.

**Atualização:** a agenda recarrega ao voltar de qualquer tela do painel.

**Central de avisos:**

- O aviso do salão abre o agendamento correspondente (`/painel/agenda/:id`).
- Marcar como visto atualiza só o item.
- Existe "Marcar todos como vistos".

## O que precisa ser feito

**Botões e estados vazios:**

- `ion-fab` com "Novo agendamento" na agenda, passando `?data=` (combina com a [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md)).
- Botão no estado vazio.
- Mensagens do estado vazio por passado, hoje e futuro.
- Esconder o grupo "Ativos" quando estiver vazio.

**Navegação entre dias:**

- "Hoje" e marcação do dia atual em `navegacao-dia`.
- Contagem por dia, reaproveitando os totais que o calendário mensal já recebe, se houver. Se não houver, criar um endpoint leve de contagem por intervalo, filtrando por `salao_id`.
- Corrigir a capitalização do mês.
- Título, fechar e "Hoje" no modal do calendário.

**Cores:** criar o token `--fluy-color-primary-light` no tema, ou usar um existente.

**Card de agendamento:** esconder "A receber" nos estados terminais não pagos.

**Agenda:** recarregar em `ionViewWillEnter` (sem trocar a lista por indicador de carregamento).

**Central de avisos:**

- Liberar "Ver agendamento" para o escopo do salão.
- Recarga silenciosa ou atualização local depois de marcar como visto.
- "Marcar todos como vistos": endpoint em `backend/src/modules/aviso`, se ainda não existir, filtrando por `salao_id`, mais o botão.

## Critérios de conclusão

- [ ] O botão de novo agendamento está visível sem rolar, inclusive num dia com muitos agendamentos.
- [ ] O botão de novo agendamento abre o formulário com a data em foco.
- [ ] Os dias passado, hoje e futuro sem agendamentos mostram textos diferentes.
- [ ] Não aparece mais "Ativos · 0" vazio.
- [ ] Existe "Hoje", e o dia atual é identificável na faixa de dias.
- [ ] O dia selecionado usa a cor do tema.
- [ ] Cancelados e faltas não mostram "A receber" no card.
- [ ] Uma ação feita no detalhe aparece na agenda ao voltar, sem esperar o polling.
- [ ] Os avisos do salão abrem o agendamento.
- [ ] Marcar como visto não faz a lista piscar.
- [ ] Existe "Marcar todos como vistos".
