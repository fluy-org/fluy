# Salão — Faturamento e fechamento de período

## Objetivo

Consolidar a receita do salão em um período selecionado (semana, quinzena, mês), separando atendimentos realizados, valores recebidos por método, e sinais retidos por cancelamento/no-show.

## Passo a passo

1. Salão acessa "Faturamento" no painel.
2. Sem um filtro válido na URL, o sistema abre na semana atual, resolvida no fuso do salão. Um link com filtro válido restaura o período informado e consulta os dados novamente. O menu continua abrindo sem filtro, na semana atual. Salão pode selecionar outro período:
   - Preset: semana atual / semana anterior / mês atual / mês anterior / quinzena
     - Semana vai de segunda a domingo.
     - Quinzena é a quinzena atual do mês: do dia 1 ao 15 ou do dia 16 ao último dia, conforme a data de hoje no fuso do salão.
   - OU intervalo customizado (data inicial + data final), sem limite de tamanho; a data final não pode ser anterior à inicial.
     - Os campos começam com as datas do período exibido. O relatório atual permanece até aplicar um intervalo válido pelo botão **Aplicar**.
   - Selecionar um preset consulta imediatamente e grava `periodo` na URL. Aplicar o intervalo customizado grava `data_inicio` e `data_fim`, removendo o preset. Apenas abrir ou editar os campos customizados não muda o filtro aplicado nem a URL.
   - Atualizar a página, compartilhar o link ou voltar/avançar pelo histórico mantém o filtro da URL. Datas continuam civis no fuso do salão, sem conversão UTC. Não há persistência adicional em armazenamento local.
   - Filtro ausente ou inválido (preset desconhecido, datas incompletas/inválidas/invertidas, parâmetros de filtro repetidos ou preset misturado com datas) é substituído pela semana atual na URL, sem criar uma entrada adicional no histórico nem enviar o filtro inválido à API. Parâmetros de URL que não pertencem ao filtro são preservados.
   - O sistema consulta primeiro o resumo e usa o intervalo resolvido na consulta dos atendimentos. As quatro seções aparecem após as duas consultas funcionarem; falha inicial exibe erro e **Tentar novamente** para carregar o período inteiro.
3. Sistema calcula e exibe:

### Seção 1 — Resumo

- **Total faturado no período** (soma de tudo efetivamente recebido)
- Número de atendimentos concluídos
- Ticket médio: recebido dos atendimentos concluídos ÷ número de concluídos. Sinais retidos não entram. Sem concluídos, não há ticket médio.
- Quantidade de atendimentos com restante pendente (alimenta o alerta de dado incompleto).

O resumo destaca os três indicadores em cards, com o total recebido em primeiro plano e explicações sobre o que compõe o total e o ticket médio. Recebimentos por método e sinais retidos ficam lado a lado em telas largas e empilhados no celular.

### Seção 2 — Atendimentos realizados

Lista tabular, paginada, do mais recente para o mais antigo, com colunas:
- Data (da conclusão, no fuso do salão)
- Cliente
- Procedimento
- Valor total
- Sinal (valor + método)
- Restante (valor + método)
- Valor pendente

Sinal e restante são distinguidos pelo tipo gravado em cada pagamento (`pagamento_agendamento.tipo`), não pelo método.

A tabela é exibida acima de 900 px; até 900 px, os mesmos campos aparecem em cards. Datas de eventos mostram data e hora no fuso do salão. Valores usam reais, com método e origem (manual/online) dos pagamentos; pagamentos ausentes e ticket médio sem concluídos aparecem como “—”, e valores zero continuam monetários.

Os nomes das clientes abrem suas fichas em `/painel/clientes/:id`. Cada atendimento oferece **Ver atendimento**, que abre o detalhe em `/painel/agenda/:id`. Os sinais retidos também dão acesso à ficha da cliente e ao detalhe do agendamento. São links de consulta; a tela não executa correções financeiras. O procedimento continua identificado pelo nome registrado no relatório, pois ainda não existe uma página individual de consulta do procedimento. Valores monetários ficam alinhados à direita na tabela, com método e origem em texto secundário e pendências destacadas por texto e cor.

A lista acumula páginas por cursor com infinite scroll ao final do conteúdo, sem repetir `agendamento_id`. Trocar período reinicia a lista. Falha de uma próxima página preserva os dados e o cursor e permite tentar novamente na seção de atendimentos. Respostas antigas de outro período ou recebidas após sair da tela são descartadas.

### Seção 3 — Recebimento por método

Ex.:
- Dinheiro: R$ X
- PIX: R$ Y
- Cartão máquina: R$ Z
- Sinal via gateway (PIX/cartão online): R$ W

Inclui os sinais retidos da seção 4: a soma da seção 3 é igual ao total faturado.

### Seção 4 — Sinais retidos por cancelamento e no-show

Lista separada, só com os encerramentos em que algum valor ficou retido (cancelamento ou no-show sem pagamento não aparece aqui):
- Data (do cancelamento ou do no-show, no fuso do salão)
- Cliente
- Procedimento (que não aconteceu)
- Valor do sinal
- Motivo (cancelamento pela cliente / no-show / cancelamento pelo salão sem reembolso), a partir de quem cancelou (`evento_agendamento.cancelado_por`)

4. Salão pode exportar? (fora do MVP; ver dúvidas)

## Variações

- **Período sem movimento (sem concluídos e sem sinais retidos):** mantém resumo zerado, ticket médio “—” e mensagem de período sem movimento.
- **Período com só cancelamentos/no-shows:** total faturado é só a seção 4.
- **Período com um agendamento em andamento (`Reservado`):** não conta (só entra o que foi efetivamente recebido).
- **Período que atravessa mudança de configuração** (ex.: preço do procedimento mudou no meio): usa valores congelados nos agendamentos.

## Regras de negócio

- **"Faturado" = valor efetivamente recebido.** NÃO inclui:
  - Reservas ainda não pagas
  - Agendamentos futuros
  - Valor pendente de atendimentos concluídos sem registro do restante (situação de erro)
- **Sinais retidos são receita real** e aparecem em seção separada (não são "atendimento" mas são dinheiro que entrou).
- **Cancelamento pelo salão com reembolso** NÃO aparece como receita (foi devolvido).
- **Períodos possíveis:** semana, quinzena, mês (predefinidos) + intervalo customizado.
- **Base de cálculo:** data do atendimento concluído (não data do agendamento nem data do pagamento). Para sinais retidos: data do cancelamento/no-show.
- **Valores congelados** — se o salão mudou o preço do procedimento, atendimentos passados usam o valor que estava no momento do agendamento.

## Dependências

- **Fluxos de conclusão, cancelamento, no-show** (alimentam os dados).
- **Sistema de registro de pagamento manual** (método usado no restante).
- **Sistema de sinais via gateway** (método usado no sinal).

## Casos extremos (edge cases)

- **Agendamento concluído mas sem registro de método do restante:** dado incompleto. Sistema deve alertar ("N atendimentos sem método registrado"), pedir para o salão corrigir. No modelo atual é o mesmo caso do "restante pendente" abaixo (concluir com "não recebeu" não registra método nem valor), então os dois viram um alerta só.
- **Refund tardio:** decidido (ambig #5) — rebate no período atual, nunca reabre período fechado. Até a [9.3](../../process/bloco-9-pagamento-online.md#93-reembolso-no-cancelamento), o faturamento por período não desconta reembolso.
- **Fuso horário na virada do dia/mês:** usar fuso do salão para determinar em qual período o atendimento cai.
- **Salão altera valor de um procedimento após o atendimento** (raramente): valores congelados protegem, mas se salão editar retroativamente o agendamento, precisa revalidar.
- **Múltiplos usuários (futuro) alterando dados durante o cálculo:** cache curto ou cálculo em tempo real.
- **Volume grande de atendimentos** (salões maiores): paginação da tabela.
- **Cliente ainda não pagou o restante ao final do período:** atendimento aparece na lista com valor e texto "Restante pendente", destacados visualmente. O alerta de dado incompleto é informativo e não oferece ação de correção financeira. Um concluído sem recebimento não transforma o período em vazio.

## Roteiro de validação da tela (7.2)

1. Em um salão de teste autenticado, semear no mesmo período: um concluído de R$ 200 (sinal de R$ 50 em PIX pessoal e restante de R$ 150 em dinheiro), outro concluído de R$ 200 (sinal de R$ 40 em PIX pessoal, restante não recebido), e sinais retidos em PIX pessoal de R$ 20 por cancelamento da cliente, R$ 30 por no-show e R$ 10 por cancelamento do salão sem reembolso.
2. Conferir as quatro seções: total de R$ 300, dois concluídos, ticket de R$ 120, recebimentos de R$ 150 em PIX pessoal e R$ 150 em dinheiro, os três motivos de retenção e um atendimento no alerta com R$ 160 pendentes. Os valores totais continuam congelados em R$ 200.
3. Conferir os presets e um intervalo de um único dia. Datas incompletas ou invertidas devem exibir validação sem substituir o relatório.
4. Conferir um período vazio e outro só com sinais retidos: ambos sem ticket médio, mas apenas o primeiro com mensagem de período sem movimento. Conferir também um concluído sem recebimento, que continua listado e destacado.
5. Usar eventos próximos à meia-noite e um dispositivo em outro fuso; o recorte e as datas exibidas devem seguir o salão.
6. Com volume suficiente para mais de uma página, chegar ao final do conteúdo e conferir a acumulação sem duplicatas. Simular falha na próxima página e repetir sem perder os dados carregados.
7. Simular falha em cada consulta inicial e conferir a nova tentativa do período inteiro. Trocar período ou sair durante uma consulta e confirmar que respostas antigas não sobrescrevem a seleção atual.
8. Conferir tabela acima de 900 px, cards até 900 px, acesso por teclado e retorno pelo menu à semana atual com dados novamente consultados.
9. Abrir a ficha da cliente pelo nome e o detalhe pelo link do atendimento ou agendamento, tanto na tabela quanto nos cards. Conferir os destinos e o foco por teclado. Voltar pelo histórico restaura o filtro da URL; acessar pelo menu abre a semana atual.
10. Abrir diretamente um link com preset e outro com intervalo customizado, conferir o seletor e os campos, atualizar a página e usar voltar/avançar após trocar o período. Conferir que editar um intervalo sem aplicar preserva a URL. Testar parâmetros inválidos ou repetidos: a URL deve voltar à semana atual, sem consulta inválida ou ciclo de redirecionamento.

## Dúvidas em aberto

- **Exportação (CSV, PDF):** demanda comum para contabilidade; fora do MVP.
- **Comparação com período anterior** (semana vs. semana anterior): útil como indicador; fora do MVP mas fácil.
- **Gráficos visuais** (barras, pizza): fora do MVP; foco em números tabulares.
- **Faturamento por profissional** (futuro multi-profissional): já prever coluna/filtro na modelagem.
- **Descontos concedidos** (ex.: cortesia, promoção): o valor cobrado foi menor que o cadastrado; precisa registrar diferença. MVP: cobre via "valor pendente = valor total - sinal - desconto", mas fluxo não está desenhado aqui.
- **Comissões (quando multi-profissional):** fora do MVP.
- **Taxa do Fluy** (quando entrar cobrança do SaaS): não aparece como despesa do salão neste relatório? Ou aparece? Fora do MVP.
- **Reconciliação com extrato bancário / gateway:** fora do MVP.
