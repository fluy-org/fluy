# Execução do fluxo de pagamento — 28/10/2026

## Resultado e limites

Implementados recebimento da dona, reserva pública paga, checkout sinal/total,
retorno e recuperação. Não é aceite completo do bloco 9: navegador, PostgreSQL
real e homologação externa estão pendentes. Produção continua bloqueada.

Branch: feat/rudney/fluxo-pagamento. HEAD inicial e final fd102d4, descendente
de b131d67. Árvore inicialmente limpa. git fetch origin recusado ao escrever
.git/FETCH_HEAD; HEAD coincide com a referência remota local, sem comprovar
atualização externa. Nenhum commit, push, merge ou deploy realizado.

## Leitura e decisões

Lidos CLAUDE.md da raiz, backend, backend/src, backend/src/modules e frontend;
shared/providers/shared foram consultados na revisão do provider existente.
Lidos os documentos de integração/viabilidade Efí, bloco 9, auditoria,
preparação de checkout, pagamentos, configuração, agendamento e fluxos públicos,
onboarding e pendências. Conferidos contratos e testes das features afetadas.
Não existem AGENTS.md versionados neste checkout.

- Conta atual do salão, recebimento direto por chave Pix; não abrir conta Efí
  para cada salão nem receber/repasse pelo Fluy.
- Cliente paga tarifa discriminada. Preço e mecanismo de produção ainda
  dependem de contratação; zero da Efí é condição de homologação.
- Decisão obtida nesta execução: sinal zero confirma sem antecipação, inclusive
  gratuito; eventual total fica para o atendimento. Proteção também no backend.
- Confirmação tardia: contato com salão para combinar remarcação/devolução,
  sem garantir horário nem prometer devolução automática.
- Documentos canônicos atualizados. Hipóteses históricas de gateway, apagamento
  da reserva e falta de decisão sobre confirmação tardia não prevalecem.

## Matriz de aceite e situação final

| Requisito | Fonte | Existente / reaproveitado | Entrega / evidência | Situação | Bloco |
|---|---|---|---|---|---|
| Recebimento pela dona | configuração, integração | GET/PUT, guard de dona e tenant | Formulário; consulta, salvar/reabrir, preservar estado em falha | Implementado; serviço validado; tela pendente | 1 |
| Reserva e slot | domínio, integração | Locks, duplicidade, expiração | Tela paga usa reservas; clique duplo/conflito automatizados | Implementado e validado em serviços; concorrência real pendente | 2 |
| Sinal zero/gratuito | decisão Rudney | Rota direta existente | Sinal positivo recusado na rota direta; gratuito não cobra configuração antiga | Validado em backend | 2 |
| Referências | fluxo 03 | Upload escopado por cliente/salão aceita reserva | Mesmo id; aviso persistido de falha parcial e retry de imagens faltantes | Implementado; regra de upload reaproveitada; telas pendentes | 2 |
| Sinal/total, tarifa | pagamentos, prompt | Tentativa, quote e snapshots | Valores recebidos da API antes de autorizar banco; nome congelado | Implementado; serviços/mapper validados | 3 |
| Pagador e instituições | schema, integração | CPF e lista do provider | Reactive Forms/Zod, retry de lista, erros recuperáveis | Serviços validados; formulário pendente no Chrome | 3 |
| Timeout incerto | integração | Idempotência persistida | Modalidade vinculada à tentativa; consultar/continuar mesma reserva | Validado no frontend sem navegador | 3 |
| Retorno seguro | prompt e Efí | Sessão de dispositivo | Rota global não interpreta query como confirmação; contexto por reserva com vínculo do dispositivo | Implementado; testes de tela escritos, pendentes | 4 |
| Confirmação e polling | integração | Webhook e consulta | 5s, limite 120, sem sobreposição, descarte de resposta antiga, cancelamento | Serviços validados | 4 |
| Confirmação tardia | decisão Rudney | Divergência persistida | Contato WhatsApp e aviso sem horário/devolução garantidos | Estado validado em serviço; tela pendente | 4 |
| Financeiro/manual | auditoria e domínio | Motor, alocações, faturamento, pagamentos manuais | Sem segundo motor; suíte financeira existente preservada | Regressão backend passou | 5 |
| Percurso visual com fake | prompt | Provider e simulação autenticada existentes | Roteiro em efi-checkout-preparacao.md | Pendente: ChromeHeadless não inicia | 5 |
| Homologação/produção | viabilidade e configuração | Bloqueio de produção | Nenhuma credencial usada, chamada bancária ou liberação | Pendente; produção bloqueada | 5 |

## Contratos e arquitetura

Extensões aditivas em @fluy/schema, consumidas pelos DTOs Swagger existentes:

- Procedimento público: valor_sinal monetário, calculado com o helper canônico
  de agendamento (incluindo percentual/arredondamento e gratuito).
- Salão público: fuso_horario, usado pelo pipe único de instantes.
- Pagamento: nome_recebedor congelado na tentativa. Alterar cadastro depois
  não muda o recebedor exibido para uma tentativa já preparada.

Sem DDL novo e sem alteração de migrations. Webhook genérico, adapter Efí,
locks financeiros, deduplicação e alocações foram preservados. A rota direta
pública só confirma sem antecipação quando o sinal calculado é zero;
rotas manuais do salão continuam funcionando.

Frontend mantém HttpClient em services, contracts na feature, signals com
leitura readonly nos services e formulários reativos com Zod canônico.
CheckoutService foi separado porque a página pública existente já concentra
catálogo, sessão, agenda e anexos; não é wrapper HTTP genérico.

## Telas e recuperação

- Dona: /painel/configuracao → Recebimento Pix. Loading, ausência de cadastro,
  validação, salvamento, erro e preservação dos dados digitados.
- Cliente: /s/:subdominio → procedimento/horário/revisão → reserva e anexos →
  /s/:subdominio/checkout/:id. Sem confirmar antecipadamente uma reserva paga.
- Preparar pagamento recebe a tentativa e sua cotação. Autorizar no banco é
  ação separada após exibir favorecido, principal, tarifa, total e prazo.
  Só é oferecida instrução HTTPS retornada pelo backend, sem fabricar QR Code.
- Retorno global /retorno-pagamento oferece retomada explícita de contextos
  deste origin/navegador. Não utiliza identificadorPagamento, sucesso ou erro
  como prova nem aceita destino de navegação arbitrário da query.
- Contexto por salão/reserva contém snapshot de apresentação e hash SHA-256
  da credencial local para detectar troca de identificação. Não duplica a
  credencial nem guarda CPF, chave Pix ou segredos do provider. Backend e
  sessão continuam sendo autoridade; armazenamento local não autoriza valores.
- Polling de 5s após terminar cada GET, máximo 120 consultas. Cancela ao sair,
  trocar reserva ou perder acesso (401/403/404); respostas de gerações antigas
  são descartadas. Confirmação recebida não é rebaixada por POST atrasado.
  Limite atingido oferece consulta manual, sem presumir recusa.
- Reserva expirada é decidida no servidor. Prazo visual não cancela consentimento
  bancário. Confirmação tardia mostra contato do salão, não confirmação normal.
- Resultado incerto preserva a modalidade e permite continuar a mesma tentativa
  idempotente. Não há retry financeiro automático pelo browser.
- Imagens que falharam geram aviso persistido e podem ser selecionadas novamente.

## Baseline e preparação dos testes

- npm run build:schema: passou.
- npm test --workspace=backend -- --runInBand: 82 suítes / 540 testes no baseline.
- Karma inicialmente falhou antes de executar testes porque seus aliases
  apontavam a fontes TS que reexportam arquivos com extensão .js.
- Solução final restrita a frontend/tsconfig.spec.json: aliases de teste usam
  dist compilado. O tsconfig principal de frontend foi preservado.
- ChromeHeadless continuou sem iniciar após resolver a compilação.
- Sem instalação de framework: runner auxiliar usa Jasmine e esbuild já
  instalados para testes de serviços em Node. Isso não é teste de navegador.
- O typecheck global reproduziu os dois imports inexistentes preexistentes no
  teste e2e do filtro: @/test/app-factory e @/test/db-clean. Sem exclusão de testes.

## Evidência TDD

Comandos repetidos na tabela:

- B: npm test --workspace=backend -- --runInBand --runTestsByPath <arquivo>
  (caminho relativo a backend).
- F: node frontend/scripts/testar-servicos.mjs <arquivo>
  (caminho relativo à raiz).

| Bloco / comportamento | Teste / comando RED | Falha observada antes da implementação | GREEN sem reduzir expectativa |
|---|---|---|---|
| 1: recebimento | F frontend/src/app/features/salao/configuracao/services/configuracao.service.spec.ts | getRecebimento/updateRecebimento ausentes (API nova) | 3 casos: consultar/reabrir, salvar sem refetch, erro preserva estado |
| 2: impedir bypass pago | B src/modules/agendamento/__tests__/agendamento.service.spec.ts | Sinal positivo resolveu como agendado em vez de rejeitar | Guard no motor; zero continua agendado |
| 2: delegação pública | B src/modules/agendamento/__tests__/agendamento-publico.service.spec.ts | Motor não recebia exigirSemSinal | Caminho público passa proteção; demais asserts preservados |
| 2: reserva frontend | F frontend/src/app/features/pagina-cliente/services/checkout.service.spec.ts | Após scaffold inicial, 0 POSTs em vez de 1; contexto ausente; conflito não rejeitado | Reserva única por ação, snapshot canônico, conflito sem contexto |
| 2: sinal público | B src/modules/procedimento/__tests__/procedimento.mapper.spec.ts | Campo valor_sinal ausente; esperado 19,98 para 25% de 79,90 | Contrato, seleção e mapeamento do sinal calculado |
| 2: gratuito legado | B src/modules/agendamento/__tests__/agendamento-utils.spec.ts | Cobrou 25,00 apesar de preço zero | Helper canônico retorna 0,00 |
| 3: preparar pagamento | F checkout.service.spec.ts (caminho completo acima) | iniciar/carregarInstituicoes ausentes (API nova) | Dados canônicos, clique duplo, CPF inválido, timeout bloqueia troca, retry de lista |
| 3: favorecido congelado | B src/modules/pagamento/__tests__/pagamento.mapper.spec.ts | nome_recebedor ausente no response | Nome vindo do snapshot |
| 4: fuso | B src/modules/salao/__tests__/salao.mapper.spec.ts | fuso_horario ausente | Fuso canônico exposto ao pipe |
| 4: retomar/consultar | F checkout.service.spec.ts | Métodos de retomada/consulta/polling ausentes (API nova) | Recarga sem POST extra, isolamento, cancelamento, erro de rede, divergência tardia |
| 4: vínculo de identificação | F checkout.service.spec.ts | Hash esperado com 64 caracteres estava ausente | SHA-256 e sessão real, sem exigir id privado no response de sessão |
| 4: resposta atrasada | F checkout.service.spec.ts | pendente substituiu confirmada | Confirmação terminal não é rebaixada |
| 4: referências parciais | F checkout.service.spec.ts | registrarReferenciasPendentes ausente | Aviso persistido e removido após retry |
| 4: perda de acesso | F checkout.service.spec.ts | 404 fez 2 consultas em vez de 1; 401/403 já verdes | 401/403/404 interrompem acompanhamento |

APIs novas exigiram inicialmente arquivos/métodos inexistentes. A primeira
execução de reserva falhou por import ausente e foi registrada só como etapa
de compilação; depois o scaffold executou e falhou nos asserts observáveis de
HTTP/contexto/conflito, antes de implementar. Para as demais APIs novas, a
falha foi método ausente; não foi apresentada como erro bancário.

Correção explícita de especificação: a primeira fixture de sessão pressupunha
cliente.id, mas SessaoClientePublicaResponseDto só publica nome/whatsapp.
A fixture foi alinhada ao contrato, sem expor novo dado privado. Foi adicionado
assert de vínculo SHA-256; ele falhou (undefined) antes da implementação.
Expectativas de isolamento foram mantidas, usando outra credencial.

Sem skip/only, remoção de asserts, mudança de valores esperados para acomodar
bug ou mock do cálculo monetário testado. Estados já cobertos não foram quebrados
artificialmente. Testes de tela em checkout.page.spec.ts e configuracao.page.spec.ts
foram escritos/compilados, mas não executados no Chrome; não há evidência de
RED/GREEN visual nem aceite visual completo.

## Validação final

| Verificação | Resultado |
|---|---|
| build:schema | Passou |
| Backend completo | 84 suítes / 545 testes passaram |
| Jasmine/Node dos serviços frontend | 19 testes passaram (16 checkout + 3 recebimento) |
| Typecheck frontend (app) | Passou |
| Typecheck frontend (tsconfig.spec.json) | Passou |
| Typecheck schema | Passou na execução global |
| Typecheck global | Bloqueado somente pelos 2 imports preexistentes do filtro |
| Build backend | Passou |
| Build frontend padrão | Compilou, falhou ao copiar asset em frontend/www/assets/icon por EPERM |
| Build frontend em pasta temporária | Passou, incluindo templates; avisos de bundle e SCSS existentes |
| ESLint dos TS backend alterados | Passou |
| ESLint dos TS/HTML frontend alterados | Passou usando a configuração eslintrc existente; sem migração de ferramenta |
| Karma/ChromeHeadless | Compilou; ChromeHeadless não inicia após 3 tentativas |
| git diff --check | Passou |
| PostgreSQL isolado | Pendente: Docker Desktop Linux Engine indisponível |
| Roteiro de telas com fake | Pendente: não executado no navegador |
| Efí externa | Não executada; sem credenciais/certificado usados |

Comandos adicionais: npm run build --workspace=backend;
npm run typecheck; node node_modules/typescript/bin/tsc --noEmit -p
frontend/tsconfig.spec.json; npm run test --workspace=fluy-frontend --
--watch=false --browsers=ChromeHeadless. Build alternativo:
npm exec --workspace=fluy-frontend -- ng build --output-path=<pasta temporária>.
O alternativo não transforma o build padrão ou o teste de navegador em sucesso.

## Pendências e handoff

- Executar roteiro visual com fake, inclusive anexos, navegação móvel,
  troca de app e retorno. Está em efi-checkout-preparacao.md.
- Executar locks e disputa de slot em PostgreSQL descartável; mocks/testes SQL
  existentes não provam concorrência real.
- Corrigir harness preexistente do teste do filtro para liberar typecheck global.
- Preparar ambiente Efí com credenciais/escopos/P12 e URLs HTTPS segundo o guia.
  Não enviar segredos pelo chat. Validar TLS, callback, recusa, retorno ausente,
  timeout e confirmação tardia reais.
- Confirmar pela conta Efí o modelo multi-salão externo, preço e mecanismo de
  tarifa. Não houve comprovação comercial nova nem alteração do produto escolhido.
- Produção segue bloqueada. Nenhum reembolso automático ou cobrança do restante
  pelo painel foi acrescentado.

## Commit proposto, não executado

feat(pagamento): integra recebimento do salão e checkout Pix

CLAUDE.md exige: “Nunca commitar direto. Gere a mensagem, apresente e aguarde
aprovação.” Sem autorização explícita de commit nesta solicitação e sem
escrita disponível em .git. Nenhum hash de commit novo a informar.

## Revisão final solicitada por Rudney — 28/10/2026

O staged estava vazio. Foram revisados o diff de trabalho e os arquivos novos
que compõem esta etapa, além de dependências diretas necessárias, sem varrer
outras features. O conjunto tem 54 arquivos alterados/novos ao concluir.
Não foi feito stage, commit, push, inicialização da aplicação ou operação no banco.

### Regras aplicadas

- CLAUDE.md da raiz.
- backend/CLAUDE.md.
- backend/src/CLAUDE.md.
- backend/src/modules/CLAUDE.md.
- frontend/CLAUDE.md.

A verificação dos ancestrais dos arquivos alterados não encontrou outros
CLAUDE.md ou AGENTS.md aplicáveis. Arquitetura/HTTP/tenant, contrato compartilhado,
signals, validação e responsabilidades das camadas foram considerados.

### Problemas comprovados e correções

| Problema introduzido | Evidência | Correção |
|---|---|---|
| Link Escolher outro horário recebia o signal como segmento da rota | RouterLink usava subdominio em vez de subdominio() | Passa o valor; acrescentado teste de urlTree para /s/salao-a |
| Iniciação de uma reserva reutilizava Promise de outra após navegação | Teste obteve 0 POSTs em vez de 1 e pagamento atual ausente | Iniciação e deduplicação separadas por geração; finally antigo não limpa operação nova |
| Reserva atrasada sobrescrevia contexto já retomado | Teste esperava reserva original e recebeu id da resposta atrasada | Guarda a reserva para recuperação, mas só publica na geração correspondente |
| Página mantinha contexto anterior ao falhar antes de retomar, ou publicava efeitos após sair | carregar só limpava via retomar, depois de buscar salão; iniciar chamava acompanhar após await sem validar versão | Limpeza antes de carregar; guards de versão nas ações, erros e loading; sair impede polling/redirect tardios |
| Upload terminado após trocar reserva escrevia aviso no contexto atual | registrarReferenciasPendentes atuava exclusivamente sobre _contexto | Atualização explicitamente escopada por salão/id capturados; preserva resultado na reserva original e não altera UI da próxima |
| Runner de testes podia terminar com exit code 0 sem executar a suíte | Importação de página incompatível com Node retornou 0 e nenhuma execução; após correção retornou 1 com diagnóstico | Catch explícito na importação/execução define falha de processo |

Violação de padrão corrigida: procedimento.mapper.ts calculava o sinal. O
CLAUDE.md de modules atribui regra de negócio ao service e conversão HTTP ao
mapper. O cálculo agora fica em ProcedimentoService.listarAtivos, reutilizando
helper canônico e retornando tipo interno em contracts/. O mapper só converte
valor_sinal_calculado para número, sem duplicar regra financeira.

Os testes de domínio preservam os resultados 19,98 (25% de 79,90) e zero para
gratuito. Os testes do mapper foram ajustados ao novo input interno; as mesmas
expectativas de saída foram mantidas. Foi removido mock vazio de @fluy/schema
no teste do service para usar as constantes reais exigidas pelo helper.

A fixture de ausência de recebimento no teste de página retornava 200/null,
fora do contrato. Foi corrigida para 404 e usa o interceptor real de ApiError,
com assert de que o formulário fica disponível. Isso é correção da especificação
do teste, não nova regra de produto.

### Verificação após corrigir

- Backend completo: 84 suítes / 546 testes passaram.
- Frontend de serviços em Jasmine/Node: 23 testes passaram.
- Typecheck frontend app e specs e schema: passaram.
- Typecheck global: somente os 2 imports preexistentes do teste do filtro
  (@/test/app-factory e @/test/db-clean). Fora do diff e não alterados.
- ESLint dos TS backend e TS/HTML frontend alterados: passou usando configs
  existentes. O aviso de eslintrc legado não foi tratado como bug do produto.
- Build backend: passou. Build frontend com templates em pasta temporária:
  passou; avisos de orçamento de bundle/SCSS permanecem, sem relaxar limites.
- Karma: bundle de testes compilou; ChromeHeadless não iniciou nas 3 tentativas.
  Testes de página/orquestração e navegação foram escritos e compilados, mas
  não foram executados no navegador. A tentativa de executá-los em Node foi
  recusada por import de diretório de Ionic; não conta como teste visual.
- git diff --check: passou. Nenhum assert removido, skip/only ou framework novo.

Não ficou decisão de negócio pendente desta revisão. Permanecem pendentes de
ambiente o aceite no navegador, PostgreSQL isolado e homologação externa;
produção continua bloqueada. A revisão não afirma validação desses níveis.

### Funcionalidades da etapa revisada

- [x] Cadastro/consulta/atualização do recebimento Pix da dona.
- [x] Reserva pública com sinal positivo; sinal zero/gratuito sem antecipação.
- [x] Checkout sinal/total com principal, tarifa, total e favorecido canônicos.
- [x] Autorização por URL, retorno sem confirmar pela query e acompanhamento.
- [x] Recuperação, isolamento entre reservas e confirmação tardia com contato.
- [x] Referências preservadas, aviso de falha e retry escopado ao agendamento.
