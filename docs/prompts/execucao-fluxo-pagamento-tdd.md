# Prompt de execução — recebimento do salão e checkout Pix

## Missão e entrega esperada

Implemente o fluxo de pagamento do Fluy, usando o backend já existente: o salão configura seu recebimento e a cliente reserva um horário, escolhe sinal ou total, autoriza o Pix no banco e acompanha a confirmação no checkout. Entregue uma integração vertical com telas reais, erros, recuperação e testes, preservando as regras do projeto.

Trabalhe em blocos sequenciais com TDD obrigatório para o fluxo de pagamento. Não implemente tudo de uma vez. Este documento autoriza executar o escopo abaixo; não execute somente um planejamento e encerre.

## 1. Preparação e branch

- Repositório: Fluy. Branch base: `feat/rudney/integracao-efi`.
- Branch de trabalho: `feat/rudney/fluxo-pagamento`. Nunca implemente direto na base ou na main.
- Confira status, branch, último commit e remoto. A auditoria foi integrada no commit `b131d67`; confirme que a base contém esse commit ou equivalente antes de partir dela.
- Com árvore limpa, atualize a base por fast-forward e crie a branch. Se ela já existir, confira sua ancestralidade e retome sem recriar ou descartar trabalho. Se houver alterações locais, identifique sua origem antes de mudar a base; não use reset, clean ou stash automático.
- Falha de rede ou permissão não autoriza presumir sincronização, contornar restrições ou anunciar branch/commit criado. Informe o comando bloqueado e continue somente no que for independente dele.

## 2. Leitura e fonte de verdade

Antes de escrever código:

1. Leia `CLAUDE.md`, eventuais `AGENTS.md`, variações locais aplicáveis e toda a cadeia de instruções das pastas que serão tocadas. Inclua `backend/CLAUDE.md`, `backend/src/CLAUDE.md`, `backend/src/modules/CLAUDE.md`, regras de shared/providers/config/database quando aplicáveis e `frontend/CLAUDE.md`.
2. Leia `docs/process/efi-open-finance-integracao.md`, `docs/process/efi-open-finance-viabilidade.md`, `docs/process/bloco-9-pagamento-online.md`, `docs/process/auditoria-pagamento-regras-claude.md` e `docs/process/efi-checkout-preparacao.md`.
3. Leia `docs/features/pagamentos.md`, `docs/features/configuracao-do-salao.md`, `docs/domain/pagamentos.md`, `docs/domain/agendamento.md`, `docs/flows/cliente/03-criacao-agendamento.md`, `docs/flows/salao/01-onboarding.md` e `docs/flows/PENDENCIAS.md`. Expanda a leitura apenas conforme dependências reais.
4. Confira os contratos de `@fluy/schema`, os testes existentes e as implementações envolvidas. Código existente não substitui regra documental.
5. Produza uma matriz curta: requisito, fonte, comportamento existente, lacuna, teste de aceite e bloco responsável. Liste conflitos e resolva os que já têm respaldo documental. As decisões de negócio registradas neste prompt foram dadas pelo usuário e devem ser incorporadas aos MDs canônicos pertinentes antes dos testes; não pergunte novamente o que já foi decidido. Atualize os documentos afetados junto da implementação.

O prompt `docs/prompts/planejamento-feature.md` é referência de planejamento, não foi invocado como fluxo de entrevista. Este é um prompt de execução. Resolva questões técnicas autonomamente consultando os MDs, o código e a documentação oficial do provider: arquitetura, rotas, armazenamento de contexto, polling, runners e distribuição de responsabilidades são responsabilidade do agente. Não peça ao usuário para escolher soluções técnicas. Traga perguntas somente quando faltar uma regra de negócio ou uma decisão sobre a experiência do salão/cliente. Explique a consequência em linguagem de produto e, quando possível, ofereça opções. Prossiga nas partes independentes enquanto a decisão estiver pendente. Limitações comerciais ou técnicas da Efí devem ser verificadas pelo agente; só peça ao usuário ações que dependam da conta dele, como obter credenciais ou solicitar habilitação.

## 3. Limites e decisões que você não deve inventar

- A integração atual é **API Pix via Open Finance da Efí em homologação**. Mantenha o bloqueio de produção. Não troque por API Pix Cob/CobV, split, cartão ou Stripe Connect por analogia.
- O backend permite cadastrar chave Pix e nome do recebedor. Isso não abre conta bancária, não verifica titularidade e não comprova habilitação para receber em produção.
- **Decisão de Rudney em 28/10/2026:** o salão usa sua conta bancária atual, cadastra a chave Pix no Fluy e recebe diretamente; o Fluy não recebe para repassar. “Criar conta” significa a conta do salão na plataforma e sua configuração de recebimento. Não implemente abertura de conta bancária Efí. Confirme a viabilidade comercial/técnica desse modelo; se a Efí não atender, apresente a incompatibilidade antes de mudar a experiência de negócio.
- Pode desenvolver e testar todo o fluxo local/fake e em homologação sem concluir a habilitação comercial. Ausência de credenciais não bloqueia código e testes isolados; bloqueia apenas o aceite externo correspondente.
- Uma aplicação para múltiplos salões, bancos externos, tarifas reais, mecanismo de cobrança e devoluções continuam sujeitos à comprovação. **Decisão de negócio:** a cliente paga a tarifa adicional, discriminada antes da autorização. Isso não comprova que a Efí permita separar os valores ou entregar ao salão o principal integral sem custo para o Fluy. Verifique essa compatibilidade; não cobre uma estimativa inventada nem implemente taxa no frontend. A cotação zero atual vale só para homologação. Se o mecanismo não suportar a regra, documente o bloqueio de produção e traga a alternativa de negócio para decisão.
- Escopo: cadastro/configuração de recebimento, reserva pública, checkout sinal/total, autorização externa, retorno, consulta e confirmação. Preserve pagamentos manuais, referências/anexos, agenda e faturamento existentes.
- Reembolso automático, cobrança online do restante pelo painel e link de sinal manual são fatias posteriores do bloco 9. Não as implemente silenciosamente; informe se algum requisito novo depender delas.

## 4. Arquitetura que deve ser preservada

- Reuse `backend/src/modules/pagamento`, `shared/providers/payment`, cadastro de recebimento e entidades financeiras. Não crie segundo motor financeiro.
- Detalhes Efí ficam no provider/adapter; controllers e domínio não interpretam payload ou segredo Efí. Preserve o webhook genérico `POST /webhooks/pagamentos`.
- Toda operação financeira respeita tenant e cliente. Nunca aceite salão, favorecido ou preço livremente escolhidos pelo browser.
- Contratos HTTP são canônicos em `@fluy/schema`; não duplique tipos no frontend. Mudança de contrato exige backend, schema, frontend, Swagger, testes e documentação coerentes.
- Preserve idempotência, snapshots, alocações sinal/restante, deduplicação e confirmação atômica. A regra financeira continua no domínio; o repository executa a decisão pura após obter locks, dentro da transação, conforme `backend/src/modules/CLAUDE.md`.
- Frontend: standalone, signals, service com escrita privada/leitura readonly, HttpClient em services, componentes de apresentação OnPush, formulários reativos com Zod canônico, aliases e componentes Ionic conforme documentação.
- Migração somente se houver alteração real de DDL; gere migração nova. Não altere migrações antigas nem use db:push em banco persistente.

## 5. Pontos de entrada já encontrados

Confirme estes caminhos no checkout atual antes de editar:

- `frontend/src/app/features/pagina-cliente/pages/pagina-cliente/pagina-cliente.page.ts` e template: fluxo público existente.
- `frontend/src/app/features/pagina-cliente/services/pagina-cliente.service.ts`: hoje cria agendamento público diretamente; o fluxo pago precisa usar reserva, sem confirmar antecipadamente nem remover os caminhos sem pagamento previstos pelo produto.
- `frontend/src/app/features/pagina-cliente/pagina-cliente.routes.ts` e `frontend/src/app/app.routes.ts`: navegação e retorno.
- `frontend/src/app/features/salao/configuracao/`: tela e service para integrar recebimento.
- `backend/src/modules/pagamento/pagamento.controller.ts`, services, contracts e testes.
- `shared/schema/src/cobranca_gateway/` e `shared/schema/src/configuracao_salao/`: schemas, tipos e estados reais.

Endpoints disponíveis:

| Operação                    | Contrato existente                                               |
| --------------------------- | ---------------------------------------------------------------- |
| Recebimento da dona         | GET/PUT /salao/configuracao/recebimento-pix                      |
| Nome público do favorecido  | GET /publico/s/:subdominio/reservas/checkout                     |
| Instituições                | GET /publico/s/:subdominio/reservas/instituicoes                 |
| Reserva                     | POST /publico/s/:subdominio/reservas                             |
| Iniciar/continuar pagamento | POST /publico/s/:subdominio/reservas/:id/pagamentos              |
| Consultar                   | GET /publico/s/:subdominio/reservas/:id/pagamento?credencial=... |

O GET checkout devolve nome do recebedor; não é endpoint de cotação. A resposta de pagamento fornece valores, vencimento, situação e instrução de autorização. Confira se isso permite apresentar o total canônico antes de autorizar o banco. Se faltar contrato, especifique a extensão mínima e cubra com TDD; não calcule tarifa fictícia no frontend.

## 6. Protocolo TDD obrigatório por comportamento

Os requisitos documentados e as decisões aprovadas definem o comportamento; os testes o tornam verificável. Testes não autorizam inventar regra de negócio.

1. **Baseline:** execute a suíte relevante antes da alteração e registre falhas preexistentes separadamente.
2. **Especificação:** derive um caso observável da matriz de aceite, incluindo entradas e resultado esperado. Teste comportamento, não detalhes internos nem um espelho da implementação.
3. **RED:** escreva ou amplie primeiro o teste. Execute-o antes de alterar código produtivo. Registre comando, cenário e falha esperada. A falha deve demonstrar o comportamento ausente; falha de ambiente/import/configuração não é evidência suficiente de RED comportamental. Uma API ainda inexistente pode exigir uma etapa de compilação inicial, mas explicite isso.
4. **GREEN:** implemente o mínimo necessário no código produtivo e rode o mesmo teste **sem alterar sua expectativa**. Corrija a implementação até passar.
5. **REFACTOR:** melhore a estrutura preservando as expectativas. Rode os testes afetados novamente.
6. Revise o diff dos testes desde RED: não remova asserts, não adicione skip/only, não reduza cobertura, não troque valores esperados para acomodar bug nem faça mocks devolverem o próprio resultado que deveria ser calculado pelo código real.
7. Se o teste estiver comprovadamente errado, explique qual requisito ou contrato demonstra o erro, corrija a especificação de forma explícita e reinicie RED → GREEN. Mudança de regra de produto precisa de decisão do usuário. Nunca ajuste teste silenciosamente para conseguir verde.
8. Comportamento já coberto e verde não exige quebrar artificialmente código ou teste; registre a cobertura reaproveitada e escreva RED apenas para a lacuna nova.

Use mocks para fronteiras externas (Efí, relógio, navegação, rede), sem mockar a regra em teste. Testes de contrato/HTTP devem exercitar controllers, validação e isolamento reais quando aplicável. Use relógio controlado para polling/expiração; sem sleeps frágeis. Para locks e disputa de slot, inclua integração em PostgreSQL isolado quando disponível; mocks não provam concorrência real.

Não instale um novo framework só por preferência. Descubra o runner atual: backend Jest, frontend Angular/Jasmine/Karma. O pagamento é fluxo crítico e deve ter teste automatizado também no frontend, além do roteiro manual.

## 7. Blocos de desenvolvimento

### Bloco 0 — diagnóstico e especificação verificável

Confirme a base, leia as regras, execute baseline, feche a matriz de aceite, defina como recuperar contexto no retorno e registre decisões/bloqueios. Compare as hipóteses antigas do bloco 9 com o documento específico da integração. Preserve pendências reais de produto; não adote indiscriminadamente o texto histórico de expiração.

### Bloco 1 — recebimento do salão

Conecte consulta e atualização à área de configuração do salão. Apresente nome/tipo/chave conforme contrato e permissão da dona. Trate carregamento, ausência de cadastro, validação, salvamento e erro com preservação dos dados digitados. Reutilize onboarding do Fluy; não obrigue a recriar uma conta existente. Não exiba “conta verificada/apta a receber” sem respaldo do backend/provider.

TDD: dona pode consultar/salvar e reabrir dados; outro salão não acessa/altera; sessão sem permissão é recusada; contrato inválido é rejeitado; falha não mostra sucesso nem habilita recebimento fictício.

### Bloco 2 — seleção de horário e reserva

Integre a reserva temporária ao fluxo pago, usando o contrato existente e valores/vencimento retornados pelo servidor. Reserve uma vez por ação, trate cliques duplos e conflito. Preserve identificação da cliente e referências. Verifique a política de anexos para reservas antes de encadear uploads; ajuste somente se necessário ao fluxo e com teste.

TDD: reserva ocupa slot; conflito não inicia pagamento; sessão de outro cliente/salão não opera a reserva; abandono expira pelo backend; recarregar/voltar não cria outra reserva sem intenção; fluxo não pago autorizado permanece funcional. Defina com base nos docs o tratamento de sinal zero/procedimento gratuito, sem cobrar valor inventado.

### Bloco 3 — checkout e iniciação

Mostre procedimento, salão/favorecido, modalidade, principal, taxa, total e vencimento com dados canônicos. Permita sinal ou total, dados do pagador e instituição carregada do backend. Inicie/continue tentativa e apresente a ação de autorização pela instrução recebida. Não invente QR Code se o contrato é uma URL de Open Finance. Não solicite senha/token bancário no Fluy.

TDD: modalidades e valores corretos; validação de CPF/instituição conforme schema; erro da lista com retry; cliques duplos; tentativa pendente reaproveitada; timeout de resultado incerto não cria outra cobrança às cegas; mudança de modalidade respeita regras de tentativa; erro 4xx/5xx mantém estado recuperável; ausência de recebimento/provider indisponível não cai em agendamento confirmado sem pagamento.

### Bloco 4 — autorização, retorno e recuperação

A URL de retorno configurada na Efí é global da aplicação; projete uma rota que recupere com segurança salão, reserva e cliente no modelo de navegação real do Fluy. Valide a navegação em /s/:subdominio e eventual roteamento por host. Não pressuponha que a query do banco contém a credencial local ou salao_id confiável.

Retorno e identificadorPagamento/erro são pistas de navegação, nunca prova de pagamento ou autorização de acesso. Use contexto local mínimo, separado por salão/reserva, e consulte o backend com a sessão do Fluy. Não coloque CPF, segredo do provider ou credenciais locais em URL de retorno nem permita redirecionamento arbitrário. Contexto ausente, expirado ou conflitante precisa de recuperação segura.

Implemente acompanhamento com consultas sem sobreposição, intervalo/limite documentados e cancelamento ao sair, trocar reserva, encerrar pagamento ou expirar sessão. Retomar a tela deve consultar a situação atual. Timer local é informativo; servidor decide validade e estado. Evite respostas antigas sobrescrevendo estado novo.

TDD: retorno “sucesso” com backend pendente continua pendente; query adulterada não confirma; confirmado mostra confirmação; recusado/expirado/indisponível têm ações corretas; erro de rede não equivale a recusa; ausência de retorno não perde confirmação recebida por webhook; recarga e ida ao banco preservam contexto; sair cancela consultas; resposta atrasada de outra reserva é descartada; confirmado_apos_expiracao apresenta divergência e não horário garantido. **Decisão de negócio:** informar que o pagamento foi identificado e orientar a cliente a contatar o salão para combinar remarcação ou devolução. Disponibilize o contato já cadastrado do salão; não reocupe o horário nem anuncie devolução automática. Não permita nova cobrança antes de esclarecer tentativa de resultado incerto.

### Bloco 5 — regressão e aceite ponta a ponta

Exercite o percurso real de telas com fake local, sem substituir a orquestração por resultado hardcoded. Valide cadastro → reserva → checkout → acompanhamento → confirmação. Depois execute homologação real somente se credenciais e ambiente estiverem disponíveis.

Preserve testes de callbacks duplicados/fora de ordem, valor divergente, origem incompatível, confirmação versus expiração e alocações no faturamento; acrescente cobertura só para lacunas ou alterações desta entrega. Verifique pagamentos manuais, anexos e agendamento sem pagamento previsto no produto. Atualize fluxos e documentação operacional.

## 8. Validação e evidência

Confirme scripts existentes e use, no mínimo, conforme arquivos afetados:

```powershell
npm run build:schema
npm test --workspace=backend -- --runInBand
npm run test --workspace=fluy-frontend -- --watch=false --browsers=ChromeHeadless
npm run typecheck
npm run build --workspace=backend
npm run build --workspace=fluy-frontend
git diff --check
```

Rode lint dos arquivos alterados com a configuração real do projeto, sem migração oportunista de ferramentas. Execute os testes focados em cada RED/GREEN e as regressões abrangentes ao fechar os blocos relevantes.

A auditoria anterior registrou dois imports preexistentes inválidos no teste do filtro global, restrição ao ChromeHeadless e impedimento de escrita na saída padrão de build. Reproduza antes de atribuir ao ambiente atual. Não exclua testes/arquivos do typecheck, não desative regras nem apresente execução alternativa como validação no navegador. Reporte exatamente o que rodou e o que ficou pendente.

Registre por bloco: requisito/teste, comando RED e motivo da falha, comando GREEN e resultado, alterações produtivas, regressões e pendências. Não registre segredos ou dados pessoais reais. Após GREEN, apresente mensagem de commit em português conforme CLAUDE e aguarde aprovação, salvo autorização explícita já dada para commits desta implementação. Não envie commits RED quebrados à branch compartilhada. Não faça merge/deploy de produção por conta própria.

## 9. Critério final

Entregue:

- Checklist completa da matriz com implementado, reaproveitado, validado ou pendente, com justificativas.
- Resumo do percurso do salão e da cliente, com caminhos de tela e estados de erro/recuperação.
- Evidência RED → GREEN por comportamento novo e resultado das regressões.
- Guia atualizado do que Rudney precisa fornecer/configurar, sem pedir segredos pelo chat.
- Lista de commits efetivamente criados e branch; não confunda sugestão de mensagem com commit executado.
- Separação explícita entre teste local com fake, homologação externa e prontidão para produção. Somente declare cada nível quando realmente validado.

## Referências externas usadas na preparação

Consultadas em 28/10/2026. Reconfira o contrato oficial antes de alterar integração externa.

- [Boas práticas oficiais do Claude Code](https://code.claude.com/docs/en/best-practices): contexto específico, resultado verificável e revisão contra especificação. O protocolo TDD detalhado acima é a exigência do usuário; um prompt sozinho não garante cumprimento, por isso a evidência de execução é obrigatória.
- [Efí — credenciais e certificado](https://dev.efipay.com.br/docs/api-open-finance/credenciais/).
- [Efí — pagamentos imediatos](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-imediatos/).
- [Efí — configuração e retorno](https://dev.efipay.com.br/docs/api-open-finance/configuracoes-de-aplicacao/).
- [Efí — callbacks](https://dev.efipay.com.br/docs/api-open-finance/webhooks/).
- [Efí — abertura de contas e restrições](https://dev.efipay.com.br/docs/api-abertura-de-contas/credenciais/).
