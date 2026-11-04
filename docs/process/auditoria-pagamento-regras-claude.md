# Auditoria técnica de pagamentos — 26/10/2026

Revisão do código na branch `feat/rudney/integracao-efi`, sem commit, push ou mudança de branch. A árvore estava limpa no início. Este relatório substitui a checklist anterior, que abrangia somente o backend Pix inicial.

## Leitura e escopo

Foram lidos os 85 documentos Markdown do projeto versionado, incluindo os 12 CLAUDE.md, frontend/architecture.md, todos os arquivos de docs/, READMEs e as referências locais de Drizzle em .agents/. Dependências instaladas, bundles gerados e metadados Git não são documentação própria do projeto. A lista exata está ao final.

Escopo: módulo pagamento inteiro; providers Efí/fake/disabled; configuração de ambiente e bootstrap; recebimento Pix; reserva pública e transações de agendamento; pagamento manual na conclusão; queries de recebimento, reembolso e total gasto da cliente; backend/schema/frontend de faturamento; agenda e formulário de conclusão. Não existe um fluxo executável de reembolso automático no estado entregue: há schema, consultas e escopo futuro documentado.

A documentação técnica explícita tem precedência. Planejamentos históricos foram confrontados com a atualização específica de homologação, sem transformar hipóteses de produção em requisitos implementados. A exceção documentada do inbox global foi preservada; o processamento financeiro após correlação recebeu filtros adicionais.

## Resultado por regra

Cada linha é um critério independente. **Conforme** significa nenhuma violação identificada na inspeção e nos testes disponíveis; não representa prova de produção. **Corrigido** identifica violações técnicas tratadas nesta alteração; contagens se referem à unidade descrita na evidência, não a bugs independentes. **Pendente** impede declarar conformidade integral. Referências abreviadas: Raiz = CLAUDE.md; backend = backend/CLAUDE.md; src/modules/shared/config/database/tenant-context/drizzle = CLAUDE.md da pasta correspondente; frontend = frontend/CLAUDE.md e architecture.md; integração = docs/process/efi-open-finance-integracao.md.

| ID | Regra verificável | Fonte | Resultado | Evidência/ocorrências |
|---|---|---|---|---|
| G01 | Documentação prevalece sobre padrões encontrados no código. | Raiz; docs/prompts | Conforme | Regras extraídas dos MDs; referências usadas somente para implementação. |
| G02 | Consultar a cadeia inteira de CLAUDE.md antes de alterar uma área. | Raiz; backend | Conforme | 12 arquivos CLAUDE.md e architecture.md incluídos na leitura. |
| G03 | Não inventar regras de negócio nem implementar capacidades adiadas. | Raiz; blocos 3–9 | Conforme | Mantidos os limites de homologação e das fatias de reembolso, checkout e cobrança pelo painel. |
| G04 | Resolver contradições documentais no mesmo conjunto de alterações. | Raiz | Corrigido | 7 documentos de referência alinhados: README do schema, domínio de alocações, bloco 9, regras de transação do backend, bloco 7, fluxo 13 e feature de faturamento. |
| G05 | Domínio em português e infraestrutura/framework em inglês. | Raiz | Conforme | Pagamento, recebimento, agendamento e faturamento; PaymentProvider e EfiTransport são infraestrutura. |
| G06 | Não misturar português e inglês numa mesma palavra composta. | Raiz | Conforme | Nenhuma ocorrência identificada no vocabulário revisado. |
| G07 | Arquivos backend usam kebab-case. | Backend | Conforme | Arquivos de execução e contratos backend revisados. Pastas de tabelas seguem a convenção snake_case específica do schema. |
| G08 | Imports internos do backend usam @/. | Backend | Corrigido | 31 imports relativos convertidos nos arquivos modificados; novos arquivos e testes movidos também usam o alias. |
| G09 | Não criar enums nativos de TypeScript. | Raiz; frontend | Conforme | Nenhum enum nativo encontrado nas implementações revisadas. |
| G10 | Comentários devem explicar motivos, sem narrar operações triviais. | Raiz | Conforme | Mantidas justificativas de locks, arredondamento, fuso e não recebimento. |
| G11 | Instantes reais devem ser armazenados em UTC. | Raiz; domain/README | Conforme | Timestamps com fuso, Date e serialização ISO; nenhum horário local persistido como instante. |
| G12 | Datas e horas civis devem permanecer no fuso do salão. | Raiz; flows | Conforme | Reserva e faturamento usam os helpers de horario-salao. |
| G13 | Cálculo/exibição de instantes usam helper backend e pipe frontend únicos. | Raiz | Conforme | Conversões pelo horario-salao e apresentação via HoraSalaoPipe. Datas civis não são instantes. |
| S01 | Dependencies de @fluy/schema limitadas a drizzle-orm, drizzle-zod e zod. | Raiz; README | Conforme | Manifesto do pacote sem Nest, driver de banco ou RxJS. |
| S02 | Tabelas Drizzle são definidas em @fluy/schema. | Raiz; backend | Conforme | Nenhuma tabela financeira recriada em backend/src. |
| S03 | Schemas de request e response HTTP são definidos em @fluy/schema. | Raiz; backend | Corrigido | 1 response sem schema: confirmação de recebimento do webhook centralizada no pacote. |
| S04 | Tipos transportados por HTTP devem ser inferidos do contrato compartilhado. | Raiz; frontend | Corrigido | Pagador, instituições e instrução de pagamento reutilizam tipos inferidos; removidas definições duplicadas. |
| S05 | DTOs Nest devem ser adaptadores finos de createZodDto em contracts/. | Backend; modules | Conforme | Inclusive o novo WebhookPagamentoResponseDto; sem Nest no pacote compartilhado. |
| S06 | Estrutura por tabela separa DDL, schemas, tipos DTO, enums e barrel. | Raiz | Conforme | Cobranças, pagamentos, reembolsos e configuração preservam a estrutura existente. |
| S07 | Constantes reutilizadas por DDL e schemas devem ser puras. | Raiz | Conforme | Nenhuma constante financeira com dependência de framework adicionada. |
| S08 | Array-enums usam as const e tipo derivado. | Raiz; frontend | Corrigido | 2 estados de UI da agenda passaram a arrays com tipos derivados. |
| S09 | Arquivos de enum não importam Zod, Drizzle ou dependências internas. | Raiz | Conforme | Enums persistidos/HTTP e novos enums da agenda são folhas de imports. |
| S10 | Colunas com enum devem usar o tipo derivado compartilhado. | Raiz | Corrigido | 2 colunas pix_tipo_chave passaram a TipoChavePix, sem alterar o DDL. |
| S11 | Schemas de enum derivam z.enum da definição canônica. | Raiz | Conforme | Modalidade, status, resultado de simulação e tipo de chave reutilizam seus arrays. |
| S12 | Tipos internos de backend e estado de UI não entram no schema compartilhado. | Raiz | Conforme | Cotação, decisão de notificação e RequestInput permanecem no backend; estados de UI no frontend. |
| S13 | Dois ou mais campos de entidade relacionada ficam aninhados no response. | Raiz | Conforme | Cliente e procedimento em agenda/faturamento usam objetos aninhados. |
| S14 | Um campo derivado de relacionamento pode ficar direto no response. | Raiz | Conforme | Nenhuma necessidade de aninhamento artificial identificada. |
| S15 | Modelo monetário usa precisão explícita. | domain/README | Conforme | numeric(10,2), conversão em centavos para cálculos e BRL no escopo atual. |
| S16 | PKs e FKs do domínio usam UUID. | domain/README | Conforme | Cobranças, vínculos, reembolsos e reservas usam UUID. IDs externos continuam strings opacas. |
| S17 | Colunas do domínio usam snake_case e timestamps usam sufixo _em. | domain/README | Conforme | Sem divergência nova nas tabelas financeiras. |
| S18 | Não criar entidades técnicas paralelas para faturamento. | domain/faturamento; bloco 7 | Conforme | Relatório e métricas permanecem derivados das tabelas financeiras existentes. |
| B01 | Features com HTTP e persistência separam controller, service e repository. | modules | Conforme | Pagamento, recebimento Pix, agendamento e faturamento separados por camada. |
| B02 | Cada feature possui contracts/index.ts. | modules | Conforme | Pagamento, configuração, agenda e faturamento têm barrels. |
| B03 | contracts/index.ts é a porta de import para consumidores da feature. | modules | Corrigido | 13 imports diretos de contratos consolidados no barrel; checkout incluído no index. |
| B04 | AppModule compõe módulos, sem registrar providers de feature diretamente. | src | Conforme | PagamentoModule e PaymentProvidersModule importados como módulos. |
| B05 | Features reutilizam os providers de banco e configuração existentes. | src; database | Conforme | Nenhum pool, cliente Drizzle ou configuração alternativa criado nas features. |
| B06 | Controllers apenas definem HTTP, delegam e mapeiam. | modules | Conforme | Sem acesso direto ao repository nem regras financeiras no controller. |
| B07 | Controllers não devolvem linhas Drizzle. | backend; modules | Conforme | Responses persistidos passam por mappers explícitos. |
| B08 | Services não dependem de DTOs de resposta HTTP. | backend; modules | Conforme | Services retornam persistência ou resultados internos; DTO de saída restrito à fronteira. |
| B09 | Mappers são puros e escolhem somente campos públicos. | modules | Conforme | CPF, chave do recebedor, idempotency_key e payload do inbox não vazam no checkout. |
| B10 | Mapper converte Date para ISO e numeric para number. | modules | Conforme | Pagamento, reserva, recebimento e faturamento preservam essas conversões. |
| B11 | Mappers seguem o nome to{Entidade}{Variante}Response. | modules | Conforme | Mappers públicos revisados seguem os nomes prescritos. |
| B12 | Tipos internos nomeados ficam em contracts/. | backend; modules | Corrigido | 4 tipos movidos: CotacaoPagamento, DecidirNotificacaoInput, DecisaoNotificacao e LinhaDaAgenda; RequestInput do adapter também separado. |
| B13 | Helpers puros fora do arquivo principal usam arquivo *-utils.ts. | modules | Corrigido | pagamento-estado renomeado; 3 funções puras extraídas do repository para agendamento-utils. |
| B14 | Constantes de configuração da feature ficam em *-data.ts. | modules; frontend | Corrigido | Status ativos de cobrança extraídos para pagamento-data.ts. |
| B15 | Métodos/funções com dois ou mais argumentos recebem objeto de input. | backend; frontend | Corrigido | 7 métodos da agenda: 5 de service e 2 helpers da página; chamadas ajustadas. Construtores DI e assinaturas exigidas por frameworks não são APIs de input de domínio. |
| B16 | Repository buscar* retorna registro ou undefined, sem lançar por ausência. | modules | Conforme | Buscas de reserva, cobrança, pagamento e recebimento retornam ausência ao service. |
| B17 | Repository listar* retorna coleções; possui* retorna boolean. | modules | Conforme | Listagens, ocupação e verificação de duplicidade preservam cardinalidade. |
| B18 | Regra dependente de persistência fica em service/validator. | modules | Corrigido | 1 fluxo corrigido: o service fornece a função pura de decisão; o repository a executa sobre o estado atual após os locks, sem conhecer a regra nem expor a transação. P3 resolvida. |
| B19 | Validação estrutural de body/query usa Zod global. | modules; src | Conforme | Inputs de pagamento e recebimento têm DTOs finos sobre schemas compartilhados. Webhook externo tem autenticação/validação próprias no adapter. |
| B20 | Regra entre campos sem persistência pode usar refine/superRefine compartilhado. | modules | Conforme | Schemas de configuração/faturamento preservados; não duplicados em controller. |
| B21 | Validator é injetável e seus métodos usam validar{Acao}. | modules | Conforme | AgendamentoValidator mantém o contrato documentado. |
| B22 | Normalização devolve novos dados em vez de mutar input. | modules | Conforme | Recebimento Pix normaliza chave/nome em novo objeto antes da atualização. |
| B23 | Somente services/validators de domínio lançam exceções Nest. | modules | Conforme | Nenhuma exceção Nest em controller, repository ou helper de domínio. Adapters de infraestrutura mantêm tradução externa documentada. |
| B24 | Ausência no tenant usa NotFoundException no service. | modules | Conforme | Reserva, sessão, cobrança e configuração ausentes tratadas no service. |
| B25 | Validação de negócio e conflitos usam exceções Nest apropriadas. | modules | Conforme | 400 para dados, 404 para ausência, 409 para estado/valor incompatível; indisponibilidade em 503. |
| B26 | Mensagens de erro em português, frases completas terminadas em ponto. | modules | Conforme | Mensagens HTTP das implementações revisadas atendem ao padrão; códigos internos não são mensagens de UI. |
| B27 | Somente AllExceptionsFilter monta o envelope de erro. | shared | Conforme | Nenhum envelope financeiro paralelo; errors externos brutos não retornam ao cliente. |
| B28 | Erros programáticos usam codigo/sugestoes da exceção, sem novo formato. | shared | Conforme | Nenhuma necessidade de novo código de erro introduzida. |
| B29 | Conflitos de constraint devem ser traduzidos por código/nome no service. | modules | Conforme | Nenhum novo caminho de constraint esperado: duplicidade da tentativa é serializada e o inbox usa onConflictDoNothing. |
| B30 | Escritas financeiras e transições relacionadas usam uma transação. | modules; bloco 3 | Conforme | Cobrança/vínculo/conclusão e evento/cobrança/alocações/reserva são atômicos nos repositories. |
| B31 | Transações usam Database injetado com @InjectDatabase. | database; modules | Conforme | Nenhuma transação criada por controller, pool local ou conexão paralela. |
| B32 | Compartilhar fragmentos de query em shared em vez de copiar regra. | shared; bloco 7 | Conforme | montarValorRecebido e montarFiltroEstadosComRecebimento usados por faturamento e ficha. |
| B33 | Não importar repository de outra feature para compartilhar queries. | shared | Conforme | Services integram features por services; regra de recebimento fica em shared. |
| H01 | Rotas de recurso usam plural em português. | modules | Conforme | reservas, pagamentos e webhooks; configuração Pix é subrecurso do salão. |
| H02 | Rotas específicas são declaradas antes das genéricas. | modules | Conforme | instituicoes/checkout antes de :id/pagamento; atendimentos antes da leitura geral. |
| H03 | Controllers usam ApiTags. | modules | Conforme | Tags presentes nas superfícies pública, de simulação, de recebimento e de faturamento. |
| H04 | Rotas protegidas usam ApiBearerAuth. | modules | Conforme | Simulação, recebimento, agenda e faturamento protegidos/documentados. |
| H05 | Handlers HTTP usam ApiOperation e request/query DTOs quando aplicáveis. | modules | Conforme | Webhook usa Request bruto pois recebe protocolo externo, conforme integração documentada. |
| H06 | Responses Swagger usam DTO.Output. | modules | Corrigido | Confirmação do webhook ganhou WebhookPagamentoResponseDto.Output. |
| H07 | Status de sucesso documentado corresponde ao status HTTP real. | modules | Corrigido | 1 divergência: simulação já retornava 201; Swagger agora usa ApiCreatedResponse, sem mudar o endpoint. |
| H08 | Documentar erros possíveis das rotas. | modules | Corrigido | 502 documentado nas 3 operações externas; 409 incluído na consulta de pagamento. |
| H09 | Parâmetros UUID usam ParseUUIDPipe. | modules | Conforme | IDs de reserva e cobrança validados; identificadores externos não recebem validação UUID artificial. |
| H10 | Rotas autenticadas por padrão e @Public somente nas anônimas. | src; auth | Conforme | Webhook explicitamente público com autenticação do adapter; reservas públicas usam metadados de tenant. |
| H11 | Não reler Authorization nem repetir autenticação no controller. | auth | Conforme | Autenticação permanece no guard; pagamento não cria bypass próprio. |
| H12 | Não habilitar autenticação fake fora do desenvolvimento. | auth; config | Conforme | Guard/configuração existentes preservados. |
| T01 | Receber o tenant autenticado por TenantFromOwner. | tenant-context; modules | Conforme | Recebimento e simulação derivam salão do dono autenticado. |
| T02 | Tenant público é resolvido num único ponto a partir do path no MVP. | tenant-context; bloco 4 | Conforme | TenantFromPath usa :subdominio; serviços não interpretam host ou path. |
| T03 | Não aceitar salaoId do cliente nem construir TenantContext manualmente. | tenant-context | Conforme | Bodies strict não escolhem salão; controllers repassam tenant.salaoId. |
| T04 | Queries financeiras recebem e filtram salaoId até o repository. | Raiz; backend | Conforme | Reserva, cobrança, recebimento, agenda, ficha e faturamento escopados diretamente ou pelo agendamento pai já filtrado. |
| T05 | Correlação e inbox globais são restritos à integração autenticada. | efi-open-finance-integracao | Conforme | Exceção específica documentada; dados do cliente não fornecem tenant do webhook. |
| T06 | Após correlação, operações do evento devem respeitar o salão resolvido. | Raiz; integração | Corrigido | 2 queries: seleção com lock e atualização do evento validam identidade externa e tenant nulo ou correspondente. Teste adicional compila os filtros reais. |
| T07 | Identidade global é exceção explícita ao filtro de salão. | Raiz; domain | Conforme | Não estendida a dados financeiros; nenhuma identidade global alterada. |
| I01 | Integrações externas são modeladas por contrato e token de DI. | shared | Conforme | PAYMENT_PROVIDER e PAYMENT_SIMULATOR; implementação concreta resolvida no módulo de infraestrutura. |
| I02 | Features não importam SDK, credenciais ou provider concreto. | shared/providers | Conforme | PagamentoService recebe PaymentProvider, sem importar Efí ou FakePaymentProvider. |
| I03 | Trocar provider não deve exigir mudança da feature consumidora. | shared/providers | Conforme | Contrato genérico preservado; configurações e restrições de origem tratadas como dados. |
| I04 | SDK/protocolo, autenticação e mapeamento específicos ficam no adapter. | shared/providers; integração | Conforme | HMAC, status Efí, IDs UUID de participantes e transporte TLS isolados em efi/. |
| I05 | Provider configurável usa ConfigService<Env,true>. | shared; config | Conforme | Configuração tipada e infer: true nas leituras financeiras. |
| I06 | Somente config lê process.env e valida/transforma ambiente. | config | Conforme | Nenhuma leitura direta de process.env em pagamentos/adapters/features. |
| I07 | Regras entre variáveis pertencem ao env.schema e têm testes. | config | Conforme | Fake limitado a development; Efí não disponível em production; credenciais obrigatórias cobertas. |
| I08 | Módulos globais exportam apenas os tokens públicos necessários. | shared | Conforme | PaymentProvidersModule exporta PAYMENT_PROVIDER e PAYMENT_SIMULATOR. |
| I09 | Efí desta entrega é exclusivamente homologação. | integração; viabilidade | Conforme | Host fixo e env validation preservados. Nenhuma chamada ao provider executada. |
| I10 | Não registrar credenciais, CPF, corpo externo bruto ou query de webhook. | integração | Conforme | Logger omite query; adapter retorna erros normalizados; inbox recebe somente notificação normalizada. |
| I11 | Webhook repassa body, raw body, headers e query sem conhecer o provider. | integração | Conforme | Controller genérico; bootstrap mantém rawBody: true; teste HTTP em memória cobre repasse. |
| I12 | Dedupe usa origem e identidade do evento, sem mudar após troca de adapter. | domain/pagamentos; integração | Conforme | Hash determinístico existente preservado; registro e aplicação usam a mesma composição. |
| I13 | Callbacks são autenticados antes da persistência. | integração | Conforme | parseNotification é aguardado antes de registrarNotificacao; origem conferida. |
| I14 | Eventos já autenticados são reprocessados independentemente do provider ativo. | integração | Conforme | Job usa payload persistido e não reautentica pelo adapter configurado. |
| I15 | Tentativa e snapshots são persistidos antes da chamada externa. | integração | Conforme | Chave idempotente, recebedor, pagador e cotação preservados para retry. |
| I16 | Redirect/sucesso de criação não confirmam pagamento. | integração | Conforme | Promoção só ocorre pelo processamento de notificação normalizada/consulta externa. |
| I17 | Confirmação concorrente/duplicada não duplica alocações. | bloco 9; integração | Conforme | Locks e dedupe mantidos; suíte financeira cobre reentrega e estados terminais. |
| I18 | Confirmação tardia não reocupa horário já liberado. | integração | Conforme | Preservado o registro de divergência e a decisão de não promover reserva encerrada. |
| I19 | Expiração preserva rastreabilidade financeira da integração atual. | integração; viabilidade | Conforme | Mantido cancelamento local com evento e cobrança, sem apagar evidência de pagamento tardio. |
| F01 | Frontend novo usa standalone, sem NgModule. | frontend/CLAUDE; architecture | Conforme | Agenda, conclusão e faturamento usam standalone. |
| F02 | Estado reativo usa signals, sem NgRx. | frontend | Conforme | Agenda e faturamento mantêm signals existentes. |
| F03 | Infra global em core, compartilhamento entre features em shared e domínio em features. | frontend | Conforme | Nenhuma nova camada ou pasta de abstração de frontend criada. |
| F04 | Pages carregadas por rota orquestram consultas e navegação. | frontend | Conforme | AgendamentoDetalhePage e FaturamentoPage concentram orquestração. |
| F05 | Components são apresentacionais com input/output e OnPush. | frontend | Conforme | Formulário de conclusão e componentes financeiros seguem o padrão; seção de anexos usa exceção embutível documentada. |
| F06 | Somente service injeta HttpClient. | frontend | Conforme | Nenhum HttpClient nos componentes/páginas financeiros. |
| F07 | Um service central por feature e providedIn root por padrão. | frontend | Conforme | AgendaService e FaturamentoService mantidos; nenhum service artificial de pagamento manual criado. |
| F08 | Escrita dos signals de service é privada e leitura pública readonly. | frontend | Conforme | Mutações financeiras atualizam estado por métodos, sem escrita externa. |
| F09 | Signals recebem substantivos e métodos recebem verbos. | frontend | Conforme | agendaDoDia, agendamento, faturamento, carregando; concluir, consultarPeriodo etc. |
| F10 | CRUD usa nomes prescritos e fluxos usam ações do domínio. | frontend | Conforme | getLista/getEntidade e ações concluir/cancelar/remarcar preservadas. |
| F11 | Mutações atualizam estado local com retorno completo do backend. | frontend | Conforme | Conclusão substitui detalhe e item da agenda; não refaz listagem como padrão. |
| F12 | Refetch é exceção para cascatas, filtros/paginação ou cache inseguro. | frontend | Conforme | Recarregamento de anexos e polling são escopados às respectivas necessidades documentadas. |
| F13 | Usar HttpClient direto, sem wrapper ApiService ou BaseService. | frontend | Conforme | Nenhum wrapper/herança adicionado. |
| F14 | Erros globais permanecem nos interceptors, com tratamento local específico e rethrow. | frontend | Conforme | ApiError tem tratamento específico nas páginas/services; erros desconhecidos são relançados. |
| F15 | Não usar Result Pattern no frontend. | frontend | Conforme | HTTP continua por Observable/Promise e exceções; resultados internos de helpers backend não são esse antipadrão de UI. |
| F16 | Contracts frontend existem desde o início e exportam barrel. | frontend | Conforme | Agenda e faturamento possuem contracts/index.ts. |
| F17 | Tipos derivados de arrays ficam em .enums; demais tipos em .types. | frontend | Corrigido | 2 tipos de estado da agenda separados em agenda.enums.ts, reexportados pelo barrel. |
| F18 | Não exportar interface/type de service ou componente. | frontend | Conforme | Nenhuma ocorrência nos services/componentes financeiros revisados. |
| F19 | Tipos HTTP vêm de @fluy/schema, sem duplicação frontend. | frontend | Conforme | Conclusão, métodos manuais e responses de faturamento importados do pacote. |
| F20 | Forms usam ReactiveFormsModule. | frontend | Conforme | Conclusão e seleção de período mantêm Reactive Forms. |
| F21 | Regras HTTP usam zodValidator e schema compartilhado. | frontend | Conforme | Sem Validators duplicando contrato de método de pagamento ou período. |
| F22 | FormControl usa schema do campo e FormGroup usa schema completo. | frontend/architecture | Corrigido | 1 FormGroup de conclusão recebeu o schema completo e 2 FormControls de período receberam seus schemas; validação final no envio preservada. |
| F23 | Erros de formulário respeitam interação/envio do usuário. | frontend | Conforme | Pagamento exige escolha consciente na submissão; erros externos e de validação separados. |
| F24 | Validators nativos são restritos a regras exclusivamente de UI. | frontend | Conforme | Não adicionados validadores nativos para contratos HTTP. |
| F25 | UI prioriza Ionic ou componentes app-* adequados. | frontend | Conforme | Seleção, botões, toggle e estruturas financeiras usam componentes existentes. |
| F26 | Textos simples priorizam ion-text preservando semântica. | frontend | Corrigido | 5 elementos p simples de conclusão convertidos a ion-text; dl/dt/dd preservados e display block mantido. |
| F27 | Imports internos frontend usam @app, sem caminhos ascendentes. | frontend | Corrigido | 38 imports ascendentes da feature agenda convertidos para alias. |
| F28 | Arquivos frontend seguem kebab-case e sufixos de papéis. | frontend | Conforme | Páginas, componentes, services, enums e tipos seguem os sufixos documentados. |
| P01 | Listas HTTP sem limite natural paginam com cursor opaco. | modules; frontend | Corrigido | Sinais retidos separados do resumo e paginados em SQL por cursor, com página fixa de 20. Frontend acumula as duas coleções com cursores independentes; P4 resolvida. |
| P02 | Página tem tamanho fixo no backend, busca limite+1 e não depende de COUNT. | modules | Conforme | Atendimentos e sinais retidos de faturamento usam tamanho 20 e limite 21. |
| P03 | Cursor inválido é BadRequestException no service. | modules; tarefa pendente | Conforme | FaturamentoService mantém a validação; unificação transversal do helper não faz parte desta auditoria. |
| P04 | Resposta paginada tem itens e proximo_cursor null na última página. | modules | Conforme | Lista financeira mantém o contrato compartilhado. |
| P05 | Frontend acumula páginas sem duplicar IDs e reinicia ao trocar filtro. | frontend; fluxo 13 | Conforme | FaturamentoService deduplica por agendamento_id, reinicia e descarta respostas antigas. |
| P06 | Busca/filtro de lista paginada permanecem server-side. | frontend | Conforme | Período financeiro é resolvido na API; frontend não filtra somente o conjunto carregado. |
| P07 | Infinite scroll desabilita sem próximo cursor. | frontend | Conforme | Página de faturamento usa proximoCursor e preserva estado em falha de paginação. |
| P08 | Listagem naturalmente limitada como agenda diária não pagina. | modules; fluxo 06 | Conforme | Agenda do dia preservada integralmente. |
| V01 | Automatizar regras críticas de pagamento, tenant, faturamento e slots. | Raiz | Conforme | Suíte existente mais regressão dos filtros do inbox; resultados abaixo. |
| V02 | Testes ficam em __tests__ próximos do código e nomeiam o arquivo coberto. | src; modules | Corrigido | Fake provider movido à infraestrutura; spec de estado renomeada; transporte Efí separado em arquivo correspondente à sua spec. |
| V03 | Testes unitários usam dependências controladas e cobrem tenant/transações. | modules | Conforme | Mocks preservados; regressão SQL não abre conexão e valida parâmetros reais. |
| V04 | Typecheck deve passar antes de considerar o trabalho pronto. | backend; process/README | Pendente | Bloqueio anterior em teste e2e do filtro global, reproduzido antes e depois. Ver P1. |
| V05 | Executar os testes afetados. | backend | Conforme | Suíte financeira focada e suíte backend completa executadas. |
| V06 | Executar build e lint quando o escopo exigir. | backend; frontend | Conforme | Builds e lint registrados abaixo, sem executar lint --fix global. |
| V07 | Mudança de DDL exige migration versionada gerada pelo Drizzle. | drizzle | Conforme | db:generate informou ausência de mudanças; alterações nas tabelas são somente tipagem TypeScript. |
| V08 | Não alterar SQL, snapshot ou journal de migração já aplicada. | drizzle | Conforme | Nenhuma migração existente alterada. |
| V09 | Não usar db:push em banco persistente nem adoção para banco novo. | drizzle; README | Conforme | Nenhum desses comandos executado. |
| V10 | Fluxo crítico precisa de validação real, além de mocks. | bloco 9; integração | Pendente | PostgreSQL real, callbacks TLS e UX em dispositivo não exercitados nesta auditoria. Ver P2. |
| V11 | Não marcar fatia concluída sem aceite do fluxo e revisão do outro dev. | process/README | Conforme | Checkboxes de produto não marcadas como resultado desta revisão. |
| V12 | Commit exige autorização, mensagem em português e tipo(escopo). | Raiz | Não aplicável | Nenhum commit/push solicitado nesta tarefa; nenhuma operação Git de escrita executada. |
| N01 | TenantFromHost aplica-se ao catálogo resolvido por host. | modules; tenant-context | Não aplicável | O MVP de reservas usa a exceção expressa TenantFromPath; não migrar roteamento. |
| N02 | Repository substituir* troca coleção inteira em transação. | modules | Não aplicável | Nenhuma substituição de coleção no escopo financeiro. |
| N03 | Repository remover* retorna void e desativar/atualizar retorna registro. | modules | Não aplicável | Nenhum novo método com esses verbos foi necessário. |
| N04 | Armazenamento, compressão e remoção de órfãos seguem regras de anexos. | bloco 8; features/anexos | Não aplicável | Pagamento apenas embute a seção existente; bytes/upload e política de retenção não alterados. |
| N05 | Não implementar nova política de reembolso ou desconto sem definição. | flows/PENDENCIAS; bloco 9 | Conforme | Reembolso permanece entidade e leitura de métricas; integração automática não implementada. |
| N06 | Não aplicar exemplos genéricos de skill acima de regra explícita do projeto. | .agents/skills/drizzle; Raiz | Conforme | Exemplos de serial IDs, process.env, paginação por chave, RLS e indexação são material genérico; não substituem UUID, ConfigService e cursor atual. |
| N07 | Prompt de planejamento não é comando ativo da auditoria. | docs/prompts | Não aplicável | Template lido como documento; a autorização atual inclui implementar correções. Não foi adotada sua restrição de apenas planejar. |

## Totais

- Conforme: 127 critérios.
- Corrigido: 22 critérios.
- Pendente: 2 critérios.
- Não aplicável: 6 critérios.

Total: 157 critérios. Contagens não somam ocorrências de código, pois uma ocorrência pode violar mais de um critério.

## Pendências e justificativas

### P1 — typecheck global bloqueado antes da auditoria (V04)

`backend/src/shared/filters/__tests__/all-exceptions.filter.e2e-spec.ts` importa `@/test/app-factory` e `@/test/db-clean`, inexistentes. O teste ainda referencia rotas de outro contexto, como `/albums`. O mesmo par de erros TS2307 foi reproduzido no início e no fim; os typechecks de frontend e schema passam. Corrigir esse teste do filtro exige definir o harness e os fixtures adequados e está fora do domínio financeiro; não foi ocultado por exclusão de arquivo ou alteração de tsconfig.

### P2 — evidência real de banco, integração e interface não produzida (V10)

Os testes usam mocks, SQL compilado e HTTP em memória. Não foi executado pagamento externo, handshake TLS real, entrega de callback, concorrência PostgreSQL real ou roteiro manual da interface. `backend/test/` contém apenas a configuração Jest, sem harness e2e funcional; o teste do filtro referido em P1 não o substitui. Não foram alterados dados ou aplicadas migrações no banco do usuário. Essa limitação impede afirmar ausência de regressão em ambiente real, embora testes e compilação tenham passado. Para fechar: harness/fixtures isolados de PostgreSQL, competição webhook/expiração e conclusão concorrente, teste autorizado Efí em homologação e roteiro de conclusão/faturamento no navegador.

### P3 — resolvida: regra escolhida pelo service e aplicada sob lock (B18)

Na revisão complementar de 26/10, o service passou a fornecer a função pura de
regra de negócio no input interno de aplicação. O tipo do callback vive em
`contracts/`, exige resultado síncrono e não expõe Drizzle ou transação.
O repository mantém a transação, bloqueia reserva/cobrança, monta o estado
atual, executa a regra fornecida e persiste sua decisão atomicamente.
Ele não importa mais `decidirNotificacao` nem escolhe a política financeira.
As exceções HTTP continuam no service.

O padrão foi explicitado em `backend/src/modules/CLAUDE.md` para evitar que
outra implementação decida sobre dados anteriores ao lock. Não foi necessário
abrir transação no service nem alterar as regras de pagamento. Novas regressões
verificam que o callback recebe o estado atualizado após os dois locks e antes
das escritas, que o repository segue a decisão recebida e que uma recusa de
valor impede todas as escritas.

### P4 — resolvida: sinais retidos paginados (P01)

A nova rota `GET /faturamento/sinais-retidos` retorna `{ fuso_horario, itens, proximo_cursor }`, com página fixa de 20. O repository filtra salão, período, estados de cancelamento/falta e soma positiva dos recebimentos confirmados antes de ordenar por data/id e aplicar LIMIT/OFFSET. O service pede 21 linhas e gera o cursor.

O resumo deixou de transportar a coleção ilimitada. Seus totais e o recebimento por método continuam calculados sobre todo o período. A UI consulta resumo e duas primeiras páginas, acumula sinais sem duplicação, preserva itens/cursor em falha e descarta respostas antigas. Um scroll no rodapé avança as listas independentemente; falhas têm nova tentativa na seção afetada.

Bloco 7, fluxo 13 e feature de faturamento foram alinhados. É uma mudança de contrato HTTP: frontend e backend desta alteração precisam ser publicados juntos. Não há mudança de DDL ou de cálculo financeiro. A consulta agregada interna do resumo continua considerando todos os encerramentos; ela não é uma página financeira truncada.

## Validação

| Verificação | Resultado e limite |
|---|---|
| Build do schema | Aprovado; tipos e novo schema de resposta compilados. |
| Suíte backend completa | **82 suítes, 540 testes aprovados**, incluindo paginação, totais integrais, tenant, decisão após os locks e recusa sem escritas. |
| Suíte focada anterior | 44 suítes, 350 testes aprovados antes da organização final dos arquivos. |
| Service frontend de faturamento | 5 testes Jasmine aprovados em Node com DI/signals Angular e RxJS reais: período, total integral, dedupe, falha/retry, troca de período e saída. ChromeHeadless não iniciou pelo Karma; esse teste de service sem DOM foi executado separadamente, sem validar interação visual. |
| SQL real de sinais retidos | Query compilada com Drizzle e cliente PostgreSQL controlado: tenant, período, cancelado/falta, HAVING de soma positiva antes do LIMIT e ordenação estável; nenhuma conexão aberta. |
| Build backend | Aprovado com transporte Efí no arquivo próprio. |
| Typecheck global | Bloqueado exclusivamente pelo par de imports de P1; frontend/schema aprovados. |
| ESLint backend alterado | Aprovado, sem erros ou avisos. |
| ESLint frontend alterado | Aprovado; aviso do executável sobre uso da configuração eslintrc existente. |
| Build Angular de produção | Compilação e geração aprovadas com saída temporária. A saída padrão frontend/www falhou ao criar assets/icon por EPERM; não foi solicitada elevação. |
| Budgets Angular | Warnings: bundle inicial de cerca de 2,91 MB para warning budget de 2 MB; SCSS da página pública 9,59 kB para warning budget de 6 kB. Não houve mudança de budgets para ocultá-los. |
| db:generate | Aprovado: 25 tabelas, nenhuma mudança de schema, nenhuma migração necessária. |
| Histórico de migrações | Nenhum SQL/snapshot/journal alterado. |
| git diff --check | Aprovado. |
| PostgreSQL/fluxo externo/roteiro manual | Não executados; P2. |

Não foi feito commit nem push. Os resultados não autorizam produção e não encerram as pendências do bloco 9.

## Inventário de documentos lidos

- `.agents/skills/drizzle/SKILL.md`
- `.agents/skills/drizzle/references/advanced-schemas.md`
- `.agents/skills/drizzle/references/performance.md`
- `.agents/skills/drizzle/references/query-patterns.md`
- `.agents/skills/drizzle/references/vs-prisma.md`
- `CLAUDE.md`
- `README.md`
- `backend/CLAUDE.md`
- `backend/README.md`
- `backend/drizzle/CLAUDE.md`
- `backend/src/CLAUDE.md`
- `backend/src/config/CLAUDE.md`
- `backend/src/database/CLAUDE.md`
- `backend/src/modules/CLAUDE.md`
- `backend/src/modules/auth/CLAUDE.md`
- `backend/src/shared/CLAUDE.md`
- `backend/src/shared/providers/CLAUDE.md`
- `backend/src/shared/tenant-context/CLAUDE.md`
- `docs/domain/README.md`
- `docs/domain/agendamento.md`
- `docs/domain/anexos.md`
- `docs/domain/clientes.md`
- `docs/domain/disponibilidade.md`
- `docs/domain/faturamento.md`
- `docs/domain/notas-e-lembretes.md`
- `docs/domain/pagamentos.md`
- `docs/domain/procedimentos.md`
- `docs/domain/salao.md`
- `docs/features/README.md`
- `docs/features/agenda-do-dia.md`
- `docs/features/anexos.md`
- `docs/features/configuracao-do-salao.md`
- `docs/features/conta-e-autenticacao.md`
- `docs/features/faturamento.md`
- `docs/features/gestao-agendamentos.md`
- `docs/features/gestao-clientes.md`
- `docs/features/gestao-disponibilidade.md`
- `docs/features/gestao-procedimentos.md`
- `docs/features/identificacao-cliente.md`
- `docs/features/lembretes-internos.md`
- `docs/features/notificacoes.md`
- `docs/features/pagamentos.md`
- `docs/flows/PENDENCIAS.md`
- `docs/flows/README.md`
- `docs/flows/cliente/01-primeiro-acesso.md`
- `docs/flows/cliente/02-retorno.md`
- `docs/flows/cliente/03-criacao-agendamento.md`
- `docs/flows/cliente/04-cancelamento.md`
- `docs/flows/cliente/05-notificacao-alteracao.md`
- `docs/flows/salao/01-onboarding.md`
- `docs/flows/salao/02-login.md`
- `docs/flows/salao/03-disponibilidade.md`
- `docs/flows/salao/04-procedimentos.md`
- `docs/flows/salao/05-agendamento-manual.md`
- `docs/flows/salao/06-agenda-dia.md`
- `docs/flows/salao/07-conclusao-atendimento.md`
- `docs/flows/salao/08-cancelamento.md`
- `docs/flows/salao/09-remarcacao.md`
- `docs/flows/salao/10-no-show.md`
- `docs/flows/salao/11-clientes-historico.md`
- `docs/flows/salao/12-lembretes.md`
- `docs/flows/salao/13-faturamento.md`
- `docs/process/README.md`
- `docs/process/auditoria-pagamento-regras-claude.md`
- `docs/process/bloco-0-fundacao.md`
- `docs/process/bloco-1-setup-salao.md`
- `docs/process/bloco-2-motor.md`
- `docs/process/bloco-3-painel-operacao.md`
- `docs/process/bloco-4-cliente-final.md`
- `docs/process/bloco-5-ficha-cliente.md`
- `docs/process/bloco-6-notificacoes.md`
- `docs/process/bloco-7-faturamento.md`
- `docs/process/bloco-8-anexos-agendamento.md`
- `docs/process/bloco-9-pagamento-online.md`
- `docs/process/efi-open-finance-integracao.md`
- `docs/process/efi-open-finance-viabilidade.md`
- `docs/process/gateways-alternativos-viabilidade.md`
- `docs/process/mercado-pago-viabilidade.md`
- `docs/process/setup-inicial.md`
- `docs/prompts/planejamento-feature.md`
- `docs/tarefas-pendentes/README.md`
- `docs/tarefas-pendentes/unificar-resolucao-cursor-paginacao.md`
- `frontend/CLAUDE.md`
- `frontend/architecture.md`
- `shared/schema/README.md`
