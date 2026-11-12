# Quadro de tarefas

Esta pasta funciona como um Jira simplificado: cada tarefa tem um arquivo em [`tarefas/`](./tarefas/), e esta página é o quadro.

As tarefas nasceram de duas fontes, em 12/11/2026:

- o teste manual do dono, com cerca de 15 minutos de uso como usuário comum;
- uma auditoria de todas as telas do salão e da cliente, feita com o olhar de uma dona de salão que recebe só o link, sem tutorial.

## Como usar

- **Pegar uma tarefa:** preencha **Responsável** no topo do arquivo e mude o **Status** para "Em andamento". Atualize também a tabela abaixo.
- **Status possíveis:** `A fazer` → `Em andamento` → `Em revisão` → `Concluída`. Use `Bloqueada` quando depender de uma decisão.
- **Concluir:** marque os critérios de conclusão do arquivo e mude o status para "Concluída" no mesmo PR que entrega a tarefa. O arquivo fica como histórico.
- **Tarefa nova:** copie a estrutura de qualquer tarefa e use o próximo número livre (`FLY-0NN-slug.md`). Seções obrigatórias:
  - Descrição;
  - Comportamento esperado;
  - O que precisa ser feito;
  - Critérios de conclusão.
- **Decisões de negócio** tomadas durante uma tarefa vão para `docs/flows/PENDENCIAS.md` e para o doc de domínio ou feature correspondente, como manda o `CLAUDE.md`.
- **Dívidas técnicas pequenas**, fora do escopo de produto, continuam em [`../tarefas-pendentes/`](../tarefas-pendentes/).

## Quadro

| ID | Tarefa | Área | Prioridade | Status | Responsável |
| --- | --- | --- | --- | --- | --- |
| [FLY-001](./tarefas/FLY-001-identificacao-da-cliente-sem-verificacao.md) | O WhatsApp de outra pessoa dá acesso à conta dela | Cliente · Segurança | **Crítica** | A fazer | — |
| [FLY-002](./tarefas/FLY-002-agendamento-sem-pagamento-online.md) | Agendar sem pagamento online: salão sem Pix e "pagar no salão" | Cliente · Pagamento | Alta | A fazer (decisão de produto) | — |
| [FLY-003](./tarefas/FLY-003-reserva-pendente-e-expirada.md) | Reserva pendente e expirada: cliente travada | Cliente · Pagamento | Alta | A fazer | — |
| [FLY-004](./tarefas/FLY-004-checkout-da-cliente.md) | Checkout simples e só de pagamento | Cliente · Pagamento | Alta | A fazer | — |
| [FLY-005](./tarefas/FLY-005-confiabilidade-do-pagamento-online.md) | Confiabilidade do pagamento: prazo, confirmação e avisos | Backend · Pagamento | Alta | A fazer | — |
| [FLY-006](./tarefas/FLY-006-primeiros-passos-do-salao.md) | Primeiros passos, link em destaque e aviso de Pix | Salão · Configuração inicial | Alta | A fazer | — |
| [FLY-007](./tarefas/FLY-007-dados-do-salao.md) | Dados do salão: criação mais clara e edição posterior | Salão · Configuração inicial | Alta | A fazer | — |
| [FLY-008](./tarefas/FLY-008-campo-de-whatsapp.md) | Campo de WhatsApp: máscara única e validação brasileira | Transversal | Alta | A fazer | — |
| [FLY-009](./tarefas/FLY-009-configuracoes-e-pix.md) | Configurações: Pix compreensível e regras validadas | Salão · Configurações | Média | A fazer | — |
| [FLY-010](./tarefas/FLY-010-login-convite-e-rotas.md) | Login, convite e rotas sem becos sem saída | Salão · Autenticação | Média | A fazer | — |
| [FLY-011](./tarefas/FLY-011-procedimentos.md) | Procedimentos: duração em horas, valores em reais, sinal claro | Salão · Procedimentos | Alta | A fazer | — |
| [FLY-012](./tarefas/FLY-012-disponibilidade-semanal.md) | Disponibilidade semanal clara, cópia que funciona e salvar visível | Salão · Disponibilidade | Alta | A fazer | — |
| [FLY-013](./tarefas/FLY-013-excecoes-e-bloqueios.md) | Exceções e bloqueios (dias especiais) | Salão · Disponibilidade | Alta | A fazer | — |
| [FLY-014](./tarefas/FLY-014-clientes-notas-e-lembretes.md) | Clientes, ficha e lembretes | Salão · Clientes | Média | A fazer | — |
| [FLY-015](./tarefas/FLY-015-novo-agendamento-pelo-salao.md) | Novo agendamento com o calendário da cliente e retorno à agenda | Salão · Agenda | Alta | A fazer | — |
| [FLY-016](./tarefas/FLY-016-detalhe-do-agendamento.md) | Detalhe do agendamento reorganizado, ações em primeiro plano | Salão · Agenda | Alta | A fazer | — |
| [FLY-017](./tarefas/FLY-017-agenda-do-dia-e-avisos.md) | Agenda do dia e central de avisos | Salão · Agenda | Média | A fazer | — |
| [FLY-018](./tarefas/FLY-018-faturamento.md) | Faturamento: espaçamento, fuso legível, estado vazio | Salão · Faturamento | Média | A fazer | — |
| [FLY-019](./tarefas/FLY-019-pagina-publica-do-salao.md) | Página pública: layout, conteúdo e app instalado | Cliente | Média (item 1 alta) | A fazer | — |
| [FLY-020](./tarefas/FLY-020-feedback-das-acoes.md) | Aviso de sucesso padronizado em todo o painel | Transversal | Alta | A fazer | — |
| [FLY-021](./tarefas/FLY-021-padrao-visual-dos-formularios.md) | Padrão visual dos formulários, contraste e tema escuro | Transversal | Alta | A fazer | — |
| [FLY-022](./tarefas/FLY-022-linguagem-mensagens-e-fuso.md) | Linguagem, mensagens de erro e fuso do salão | Transversal | Média | A fazer | — |

## Ordem sugerida e dependências

1. **Base transversal primeiro.** Ela é rápida e destrava o resto.
   - FLY-021 (visual dos formulários) e FLY-020 (avisos de sucesso): as outras tarefas de tela usam esses dois padrões.
   - FLY-008 (WhatsApp) e FLY-022 (mensagens) seguem logo depois.
2. **Já, isoladamente.** Remover a mensagem de teste da página pública (FLY-019, item 1). É uma mudança pequena com risco de constrangimento com cliente real.
3. **Segurança.** FLY-001 deve sair antes de divulgar o link de salões reais para mais clientes.
4. **Decisão de produto antes de codar.** FLY-002 precisa da política de sinal (obrigatório ou opcional). FLY-003, FLY-004 e FLY-005 podem andar em paralelo.
5. **Configuração do salão.** FLY-006 depende de FLY-007 e FLY-011 a FLY-013 estarem minimamente usáveis, porque o checklist aponta para essas telas.
6. **Calendário compartilhado.** FLY-015 cria o componente que FLY-013 reaproveita.

## Divisão sugerida entre dois desenvolvedores

As frentes tocam arquivos diferentes, o que reduz conflitos de merge.

| Frente A: painel do salão | Frente B: cliente, pagamento e segurança |
| --- | --- |
| FLY-021, FLY-020 (base) | FLY-008, FLY-022 (base) |
| FLY-006, FLY-007, FLY-009, FLY-010 | FLY-001 |
| FLY-011, FLY-012, FLY-013 | FLY-002, FLY-003 |
| FLY-014 | FLY-004, FLY-005 |
| FLY-015, FLY-016, FLY-017, FLY-018 | FLY-019 |

## De onde veio cada problema relatado pelo dono

| Relato | Tarefa |
| --- | --- |
| WhatsApp não aceita o nono dígito / campo confuso | FLY-008 |
| Endereço em textarea sem orientação | FLY-007 |
| Sem onboarding depois do cadastro | FLY-006 |
| Link do salão escondido | FLY-006 |
| Duração só em minutos | FLY-011 |
| Preços sem formatação | FLY-011 |
| Selects com texto quase invisível | FLY-021 |
| Sinal percentual pedindo valor fixo | FLY-011 |
| Placeholders encostados na lateral | FLY-021 |
| Disponibilidade confusa | FLY-012 |
| Sem botão para exceção ou bloqueio | FLY-013 |
| "Aplicar ao próximo dia" sem efeito | FLY-012 |
| "Nenhum recebimento neste período." colado | FLY-018 |
| Fuso "America/Sao_Paulo" desalinhado e com underline | FLY-018, FLY-022 |
| Experiência geral do cadastro de clientes | FLY-014 |
| Calendário do novo agendamento diferente do da cliente | FLY-015 |
| Usuário fica na tela depois de criar o agendamento | FLY-015 |
| Detalhe do agendamento cansativo | FLY-016 |
| Concluir agendamento sem retorno | FLY-020, FLY-016 |
| "Que bom ter você de volta" mal posicionado | FLY-019 |
| Pix não cadastrado impede o agendamento + aviso ao salão | FLY-002, FLY-006 |
| Sem opção de pagar no salão | FLY-002 |
| Pagamento misturado com referências | FLY-004 |
| Entrar na conta da cliente só com o WhatsApp | FLY-001 |
| Avaliação geral do pagamento | FLY-004, FLY-005 |
| Cliente travada com agendamento expirado | FLY-003 |

## Sobre a auditoria

A auditoria foi feita **lendo o código** das telas, estilos, validações e da API. Nesta rodada não foi possível operar o app no navegador.

As referências `arquivo:linha` valem para o estado do repositório em 12/11/2026.

Alguns pontos dependem de execução real e estão marcados como "não confirmado" nos tickets:

- o retorno do banco em outro navegador (FLY-005);
- o `updateOn: 'blur'` no select do sinal (FLY-011);
- o calendário com mês sem vagas (FLY-019).

Quem pegar a tarefa deve reproduzir esses pontos antes de corrigir.
