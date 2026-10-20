# Auditoria do módulo de pagamento pelas regras `CLAUDE.md`

Escopo: módulo de pagamento Pix, reserva pública, recebimento Pix, schemas e migração associados. Os 12 arquivos `CLAUDE.md` do repositório foram lidos. `[x]` indica regra conferida no escopo; `[—]` indica que a regra não incide nas alterações de pagamento.

## `CLAUDE.md` (raiz)

- [x] Documentação existente consultada como referência para o fluxo de pagamento.
- [x] Domínio em português; nomes de infraestrutura podem seguir o contrato do provedor.
- [x] Tabelas, schemas HTTP, DTOs compartilhados e enums de coluna em `@fluy/schema`, sem dependência de Nest ou PostgreSQL nesse pacote.
- [x] Estrutura por tabela, barrel, arrays `as const` e tipos derivados; modalidade e status da cobrança compartilham a mesma definição no schema e na tabela.
- [x] Resposta relacionada com dois ou mais campos é aninhada quando aplicável; os tipos internos do backend permanecem na feature.
- [x] Nenhum `enum` nativo novo.
- [x] Queries de dados do salão filtram por `salao_id`; a varredura da tarefa agendada parte da própria tabela de salões e executa as escritas separadamente por salão.
- [x] Instantes reais usam `Date`/timestamps UTC; data e hora civil da reserva passam pelo helper de fuso do agendamento.
- [x] Testes automatizados cobrem o fluxo crítico de pagamento, tenant e idempotência.
- [x] Comentários adicionados explicam motivo de concorrência, sem narrar operações triviais.
- [x] Nenhum commit foi criado; regras de mensagem de commit ficam para o momento do commit.

## `backend/CLAUDE.md`

- [x] Contratos HTTP reutilizam `@fluy/schema`; adaptadores Nest ficam em `contracts/`.
- [x] Imports internos usam `@/`, arquivos novos usam `kebab-case` e métodos com múltiplos argumentos recebem objeto de input.
- [x] Mapper converte persistência para HTTP; controllers não expõem linha Drizzle e services não dependem de DTO de resposta.
- [x] `salaoId` chega até o repository e compõe filtros de reserva, cobrança, webhook e configuração Pix.
- [x] Build, testes focados e suíte backend executados. O typecheck global tem dois imports ausentes em teste e2e antigo, descritos em “Limites”.

## `backend/drizzle/CLAUDE.md`

- [x] Tabelas foram alteradas em `shared/schema` antes da geração; `db:generate` informou ausência de alterações pendentes.
- [x] Migração `0011` e tag do journal usam prefixo sequencial e nome descritivo em português.
- [x] Script de adoção de banco legado não foi usado.
- [ ] Aplicação da migração e teste contra PostgreSQL real: banco local indisponível nesta sessão. Não há validação de estado de migração em outro ambiente.

## `backend/src/CLAUDE.md`

- [x] HTTP e regra no módulo de domínio; infraestrutura do provedor em `shared/providers/payment`.
- [x] `AppModule` importa módulos, sem registrar provider da feature diretamente.
- [x] Guardas globais considerados: rotas públicas via `@TenantFromPath()` e simulação via `@TenantFromOwner()`.
- [x] Testes co-localizados em `__tests__/`.

## `backend/src/database/CLAUDE.md`

- [x] Somente repositories injetam `Database` com `@InjectDatabase()`; controllers e services não criam conexão nem executam Drizzle.
- [x] Tabelas e tipos persistidos vêm de `@fluy/schema`.

## `backend/src/config/CLAUDE.md`

- [x] `PAYMENT_PROVIDER` validado em `env.schema.ts`; fake só é aceito com `NODE_ENV=development`.
- [x] Leitura via `ConfigService<Env, true>`; nenhuma leitura direta de `process.env` nos arquivos de pagamento.
- [x] Regra entre as duas variáveis coberta por teste.

## `backend/src/shared/CLAUDE.md`

- [x] Integração de pagamento por contrato e token; services recebem o contrato.
- [x] Seleção do adaptador em módulo de infraestrutura, que exporta apenas os tokens consumidos.
- [x] Erros HTTP passam por exceções Nest nos services e pelo filtro global; nenhuma resposta de erro montada pela feature.
- [—] Fragmentos de consulta compartilhados não foram duplicados em outra feature.

## `backend/src/shared/tenant-context/CLAUDE.md`

- [x] Rotas públicas resolvem salão do `:subdominio`; rota de simulação e configuração Pix resolvem pelo dono autenticado.
- [x] Controllers passam `tenant.salaoId` ao service; repositories aplicam o escopo.
- [x] Nenhum fluxo constrói `TenantContext`, altera request ou aceita `salaoId` do body.

## `backend/src/shared/providers/CLAUDE.md`

- [x] Fake mantém comportamento específico no adaptador; troca do provedor é feita por configuração e token.
- [x] Features consumidoras não importam SDK, credencial nem classe concreta do adaptador.
- [x] Fake fica disponível apenas no ambiente de desenvolvimento validado.

## `backend/src/modules/CLAUDE.md`

- [x] Feature com módulo, controller, service, repository, mapper, `contracts/index.ts` e import no `AppModule`.
- [x] Controller contém rota, decorators, DTOs e Swagger; regra de negócio, persistência e exceções Nest ficam fora dele.
- [x] Repository usa verbos e retornos previstos; services decidem 404/400/409. Helpers de estado e simulação retornam resultado, e a exceção Nest é lançada no service.
- [x] Rotas usam DTOs `Request`/`Query`, respostas documentadas e `ParseUUIDPipe` nos parâmetros UUID.
- [x] Rotas públicas e autenticadas documentam erros possíveis; o filtro global define o corpo.
- [—] Nenhuma listagem HTTP ilimitada foi adicionada; paginação por cursor não se aplica.
- [x] Escritas que envolvem reserva, cobrança, pagamento e evento usam transação; a decisão do webhook ocorre após lock da reserva/cobrança.
- [x] Testes co-localizados cobrem regras de valor, status, idempotência, tenant e delegação.

## `backend/src/modules/auth/CLAUDE.md`

- [x] Rotas anônimas usam metadados do decorator de tenant público; simulação depende do guard autenticado.
- [x] Controller não relê `Authorization` nem repete autenticação; identidade e adaptador de desenvolvimento permanecem nos contratos e providers existentes.

## `frontend/CLAUDE.md`

- [—] Nenhum componente, service, formulário, rota ou contrato frontend de pagamento foi introduzido neste bloco. Regras de standalone, signals, HTTP, paginação, formulários, nomenclatura e mutação local não incidem nele.

## Correções feitas na auditoria

- Controllers de pagamento e Pix separados de regra de negócio e de mapeamento; DTOs movidos para `contracts/` e respostas Swagger completadas.
- Simulação fake restringida no service e ligada a contrato/token de infraestrutura.
- Chave de idempotência do evento derivada de salão e ID externo, evitando colisão entre salões.
- Evento `expirado` persistido como `expirada`, sem confundir com falha.
- Configuração Pix incompleta recusada antes de montar resposta.
- Exceções de validação e conflito produzidas no service; helpers e fake retornam resultados tipados.
- Enum de modalidade e status centralizados em `@fluy/schema`.
- Migração `0011` renomeada em português e journal atualizado.

## Verificação e limites

- `build:schema`, build backend, `db:generate` e lint dos arquivos novos/de pagamento passaram.
- Suíte backend: 70 suítes, 468 testes passaram com `--testTimeout=15000`. O teste de compressão de imagem excedeu 5 segundos quando rodou simultaneamente às demais verificações; passou isolado e na repetição sequencial com 15 segundos.
- `typecheck` global ainda falha apenas em `backend/src/shared/filters/__tests__/all-exceptions.filter.e2e-spec.ts`: imports `@/test/app-factory` e `@/test/db-clean` inexistentes, anteriores a esta implementação.
- O lint de `backend/src/app.module.ts` ainda aponta acessos `any` em serializers Pino preexistentes; o import do módulo de pagamento não introduziu esses acessos.
- Migração e fluxo e2e com PostgreSQL real não foram executados porque o banco local não estava disponível.
