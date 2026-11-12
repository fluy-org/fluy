# FLY-015 · Novo agendamento pelo salão: calendário da cliente e finalização

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Painel do salão · Novo agendamento e remarcação |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-020 · Feedback das ações](./FLY-020-feedback-das-acoes.md), [FLY-017 · Agenda do dia](./FLY-017-agenda-do-dia-e-avisos.md) |

## Descrição

O salão marca um horário para uma cliente em uma tela de três etapas: cliente, procedimento, data e horário. Hoje, essa experiência tem dois problemas principais e vários menores.

**1. O calendário é pior que o da cliente.** A data é escolhida em um `ion-input type="date"` nativo (`frontend/src/app/features/salao/agendamentos/pages/agendamento-manual/agendamento-manual.page.html:190-205`). A aparência muda conforme o aparelho e o seletor não mostra:

- quais dias têm vaga;
- o dia da semana;
- nenhum dia pré-selecionado.

Abaixo da data vem o `app-seletor-horario` (`frontend/src/app/shared/components/seletor-horario/`), com botões pequenos e um campo de hora "Outro horário ou encaixe" sempre visível.

A cliente final usa um calendário muito melhor: o `app-calendario-mes` dentro do `escolha-horario` (`frontend/src/app/features/pagina-cliente/components/escolha-horario/`).

- É uma grade mensal em que os dias sem vaga ficam desabilitados.
- O primeiro dia livre já vem selecionado.
- O título é por extenso, como "Horários para quinta-feira, 19 de novembro".
- Os botões de horário têm 44px de altura.

A remarcação (`frontend/src/app/features/salao/agenda/components/formulario-remarcacao/`) tem uma **terceira** variante, também com date nativo. Hoje existem três seletores de data e horário diferentes no produto.

**2. Depois de agendar, o usuário fica na mesma tela.** `criarAgendamento` (`agendamento-manual.page.ts:407-422`) só reseta o formulário e não navega. Isso tem quatro efeitos:

- **Mensagem fora de vista.** A mensagem "Agendamento criado para 19/11/2026, 09:30." aparece no fim do formulário, muitas vezes fora da área visível.
- **Mensagem que persiste.** Ela vem de um sinal `agendamentoCriado` guardado no serviço global (`agendamentos.service.ts:15-20, 50`), que nunca é limpo. Por isso, a mensagem antiga **reaparece** quando o usuário abre "Novo agendamento" de novo.
- **Botão travado sem explicação.** A etapa 3 continua aberta com o formulário vazio e o botão "Agendar" desabilitado, sem explicar o motivo.
- **Data no fuso errado.** A data da mensagem é formatada sem o fuso do salão (`agendamento-manual.page.ts:95-98`).

Além disso, a agenda não recarrega ao voltar: `ionViewDidEnter` só reinicia o polling (`agenda.page.ts:210-212`). O agendamento novo pode levar até 15 s para aparecer.

O fluxo documentado (`docs/flows/salao/05-agendamento-manual.md`, passo 7) diz "salão volta à agenda".

**3. Problemas menores na etapa de horário:**

- **Selo "Requer confirmação" em horário que não pode ser marcado.** Qualquer status diferente de `disponivel` mostra esse selo (`agendamento-manual.page.html:212-215`), inclusive `indisponivel`. O usuário lê que basta confirmar, toca em "Agendar" e recebe "Escolha um horário disponível."
- **Nenhum indicador enquanto o horário é verificado.** Isso vale para `avaliarHorarioSelecionado` (`agendamento-manual.page.ts:383-405`) e para a remarcação (`agendamento-detalhe.page.ts:431-459`). Se o usuário toca em "Agendar" ou "Remarcar" antes da resposta, recebe o mesmo erro enganoso.
- **Confirmação de encaixe fora da tela.** A confirmação aparece no fim do conteúdo (`agendamento-manual.page.html:240-247`), mas o botão "Agendar" fica na barra fixa inferior. Para o usuário, o toque parece não fazer nada.
- **A data escolhida na agenda não vai para o formulário.** O botão "Novo agendamento" da agenda não passa a data que estava aberta. A tela manual só lê `cliente_id` da URL.

## Comportamento esperado

- O salão escolhe data e horário com **o mesmo componente visual** que a cliente usa:
  - grade mensal;
  - dias com vaga destacados;
  - título por extenso;
  - botões de horário grandes.
- O componente conserva o que o salão pode fazer e a cliente não: **encaixe fora da janela** e **horário no passado** (regra de `docs/flows/salao/05-agendamento-manual.md`).
  - Os dias sem vaga não são desabilitados, só ficam sem destaque.
  - Só fica bloqueado o dia que tem override "sem atendimento".
- A remarcação usa o mesmo componente.
- Ao agendar com sucesso, o usuário **sai da tela de formulário**:
  - volta para a agenda já posicionada no dia do agendamento;
  - vê um aviso de sucesso como "Agendamento criado: qui, 19/11 às 09:30", com a hora no fuso do salão;
  - o agendamento novo já aparece na lista.
- Se o agendamento começou pela ficha da cliente, o retorno é para a ficha.
- Ao abrir "Novo agendamento" pela agenda, a data em foco já vem selecionada.
- Enquanto o horário é verificado, o botão principal mostra "Verificando horário…" e fica desabilitado.
- Horário indisponível mostra o selo "Horário indisponível" em vermelho, distinto de "Requer confirmação".
- A confirmação de encaixe abre em um alerta ou modal sobre a tela, não no rodapé do conteúdo.

## O que precisa ser feito

### Backend

- Expor para o salão autenticado um endpoint de dias disponíveis do mês, por exemplo `GET /agendamentos/dias-disponiveis` com `TenantFromOwner`.
  - A lógica já existe em `AgendamentoService.listarDiasDisponiveis` (`backend/src/modules/agendamento/agendamento.service.ts:92-143`).
  - Hoje ela só está exposta na rota pública (`agendamento-publico.controller.ts:90-108`).
- Medir a latência desse cálculo, que chama `listarHorariosLivres` uma vez por dia, em sequência. Se ficar lento, paralelizar ou cachear por mês.

### Frontend: componente compartilhado

- Mover `CalendarioMesComponent` e `EscolhaHorarioComponent` para `frontend/src/app/shared/components/`.
  - Hoje a página da cliente importa de `features/salao/agenda`, ou seja, uma feature importa de outra.
- Adicionar ao calendário um modo "salão":
  - o dia livre é destacado, mas os outros continuam clicáveis;
  - um flag novo em `DiaDaGrade`, por exemplo `livre`, indica o destaque;
  - o dia bloqueado por override não é clicável.
- Corrigir a classe `dia-vazio` (`calendario-mes.component.html:47`).
  - Ela apaga todos os dias quando não há contagem, então os dias livres da cliente ficam com opacidade 0,55, contra 0,25 dos desabilitados.
  - O contraste entre "tem vaga" e "não tem" precisa ser claro.
- Corrigir o token de cor do dia selecionado.
  - `calendario-mes.component.scss:74` usa `--fluy-color-primary-light`, que não existe em `theme/variables.scss`, e cai no fallback rosa.
  - Criar o token ou usar um existente do tema roxo.
- Dar ao componente uma área opcional "Outro horário (encaixe)", recolhida por padrão, que substitui o campo de hora sempre visível.

### Frontend: telas

- **Novo agendamento:** trocar o date nativo e o `app-seletor-horario` pelo componente compartilhado.
- **Remarcação:** trocar o seletor pelo componente compartilhado.
- **Depois de criar:** navegar para `/painel/agenda?data=<AAAA-MM-DD>`, ou para a ficha quando houver `cliente_id`, e mostrar o aviso de sucesso (ver [FLY-020 · Feedback das ações](./FLY-020-feedback-das-acoes.md)).
- **Sinal `agendamentoCriado`:** remover do serviço global.
- **Agenda:**
  - ler `?data=` para abrir o dia certo;
  - recarregar em `ionViewWillEnter`;
  - passar a data em foco ao botão "Novo agendamento".
- **Tela manual:** ler `?data=` e já abrir a etapa 3 com a data selecionada, quando cliente e procedimento estiverem definidos.
- **Verificação do horário:**
  - criar um estado `avaliando`;
  - desabilitar "Agendar" e "Remarcar" com o texto "Verificando horário…" enquanto a resposta não chega.
- **Selo:** separar os três casos, `disponivel`, `requer_confirmacao` e `indisponivel`.
- **Confirmação de encaixe:** levar para `ion-alert` ou modal.
- **Fuso:** formatar todas as datas com o pipe `horaSalao`.

### Docs

- Atualizar `docs/flows/salao/05-agendamento-manual.md` e `09-remarcacao.md` com o comportamento do calendário compartilhado e o retorno à agenda.

## Critérios de conclusão

- [ ] O novo agendamento e a remarcação usam o mesmo componente de calendário da página da cliente.
- [ ] No calendário do salão, os dias com vaga são destacados e os outros continuam clicáveis.
- [ ] No calendário do salão, o encaixe fora da janela continua possível.
- [ ] Na página da cliente, nada muda no comportamento: os dias sem vaga continuam desabilitados.
- [ ] Depois de "Agendar", o usuário cai na agenda do dia do agendamento, vê o aviso de sucesso e o card novo sem esperar o polling.
- [ ] Abrir "Novo agendamento" de novo não mostra mensagem antiga.
- [ ] A partir da agenda, a data em foco chega pré-selecionada.
- [ ] Tocar em "Agendar" durante a verificação do horário não gera o erro "Escolha um horário disponível."
- [ ] O horário indisponível mostra um selo próprio.
- [ ] A confirmação de encaixe aparece sobre a tela, sem precisar rolar.
- [ ] Todas as datas e horas exibidas nessas telas usam o fuso do salão.
