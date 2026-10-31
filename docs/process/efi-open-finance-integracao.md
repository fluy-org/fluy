# Efí Open Finance — backend para homologação

## Atualização do checkout — 28/10/2026

As telas de recebimento e checkout passaram a integrar o backend, conforme [registro de execução](./fluxo-pagamento-execucao.md). O catálogo público informa valor_sinal monetário; dados públicos do salão incluem fuso_horario; pagamento inclui nome_recebedor do snapshot da tentativa. Swagger deriva dos schemas canônicos. Sem DDL novo. Sinal zero/gratuito confirma sem antecipação; a rota direta recusa sinal positivo. Retorno é /retorno-pagamento no mesmo origin do checkout e só oferece retomada local, sem confirmar pela query. Confirmação tardia exige contato do salão para remarcação/devolução, sem reocupar slot. Produção, contratação/tarifas, PostgreSQL real, interface no Chrome e homologação externa continuam pendentes.


Implementado em 25/10/2026, após aprovação do plano da fase 1. Sem alterações de telas e sem commits.

## Limite desta entrega

Esta integração permite desenvolver e testar o checkout com a API Pix via Open Finance. **Não está liberada nem validada em produção.**

O ambiente remoto é fixado em `https://openfinance-h.api.efipay.com.br`. `EFI_ENVIRONMENT` só aceita `homologation`; `PAYMENT_PROVIDER=efi` é recusado com `NODE_ENV=production`. Não existe variável que libere produção nesta entrega.

Permanecem em aberto os pontos de [viabilidade](./efi-open-finance-viabilidade.md): recebimento de múltiplos salões em bancos externos com uma aplicação, habilitação/contratação, tarifas, responsabilidade pelos custos e origem dos fundos para devoluções. O cadastro local de uma chave não comprova habilitação na Efí nem propriedade da conta.

Em homologação, a cotação envia somente o valor do salão, com `taxa_cliente=0`. Isso é uma condição dos testes, **não uma afirmação de gratuidade ou garantia de valor líquido em produção**. A taxa de R$ 1 do provider fake não foi copiada.

## Arquitetura

- `PaymentProvidersModule` resolve `PAYMENT_PROVIDER` para `disabled`, `fake` ou `efi`. A simulação continua restrita ao fake em desenvolvimento.
- `EfiTransport` usa HTTPS nativo, certificado P12, TLS >= 1.2, host de homologação fixo, prazo absoluto de 10 segundos e limite de resposta de 2 MB. Não segue redirects HTTP.
- `EfiClient` obtém token por OAuth `client_credentials`, compartilha autenticação concorrente, reutiliza o token até 30 segundos antes da expiração e tenta renovar uma vez após HTTP 401. Não repete automaticamente POST após timeout ou erro 5xx.
- As implementações Efí ficam em `shared/providers/payment/efi/`. `EfiWebhookAdapter` extrai e valida `query.hmac`; `efi-payment.mapper.ts` interpreta o contrato externo e normaliza os status. `EfiPaymentProvider` delega o webhook a esse adapter e utiliza o mapper na consulta. Regras financeiras não dependem de classes ou modelos da Efí.
- `POST /webhooks/pagamentos` é a entrada genérica. O controller repassa body, headers, query e raw body, sem conhecer o nome da credencial nem o formato do provider. O raw body é preservado na inicialização do Nest para permitir validação de assinaturas sobre os bytes originais.
- O provider continua sendo selecionado por configuração global, conforme o modelo atual do Fluy. Outro provider implementa o mesmo contrato com autenticação e mapeamento próprios, inclusive assíncronos. A identidade é obrigatória e a origem normalizada deve corresponder ao adapter ativo antes da persistência. Não foi introduzido suporte a múltiplos providers ativos simultaneamente; esse cenário exigiria resolução explícita do adapter de origem, em vez de inferir o remetente do payload.
- As capacidades adicionais do contrato são dados do pagador, identificação do provider, consulta de pagamentos, instituições participantes e normalização/autenticação de callbacks. Fake e disabled continuam sem dependência de credenciais Efí.
- `PagamentoService` reutiliza cotação, reserva, tentativas, verificação de valor e confirmação existentes. A consulta externa acontece somente depois de validar salão, cliente e reserva.
- `PagamentoWebhookService` registra e reprocessa eventos. O job existente de pagamentos executa o reprocessamento antes da expiração de reservas, a cada minuto.

## Configuração

Use o exemplo `backend/.env.example` e forneça os valores reais fora do repositório:

```dotenv
NODE_ENV=development
PAYMENT_PROVIDER=efi
EFI_ENVIRONMENT=homologation
EFI_CLIENT_ID=<client_id de homologação>
EFI_CLIENT_SECRET=<client_secret de homologação>
EFI_CERTIFICATE_PATH=C:/certificados/efi-homologacao.p12
EFI_CERTIFICATE_PASSPHRASE=<senha ou vazio>
EFI_WEBHOOK_SECRET=<segredo aleatório alfanumérico de 64 caracteres>
```

Os quatro campos obrigatórios são ID, segredo, caminho do certificado e segredo de webhook. O segredo de webhook admite 32–128 caracteres alfanuméricos. Certificado P12 e senha são usados na negociação TLS; não são headers HTTP. Certificado ausente, ilegível ou inválido impede a chamada e produz erro normalizado sem conteúdo secreto. Credenciais e certificado precisam pertencer à aplicação/ambiente corretos.

A conta Efí do integrador, a aplicação e o certificado devem ser obtidos pelo procedimento oficial. Não foi implementado cadastro automático de contas dos salões nem presumida sua dispensa em produção.

Habilite os escopos oficiais:

- `gn.opb.participants.read`;
- `gn.opb.payment.pix.send`;
- `gn.opb.payment.pix.read`;
- `gn.opb.config.write` e `gn.opb.config.read`, para configurar/conferir a aplicação externamente.

Antes do teste manual, configure a aplicação pela API oficial autenticada (`PUT /v1/config`), substituindo todos os placeholders:

```json
{
  "redirectURL": "https://seu-frontend.example/retorno-pagamento",
  "webhookURL": "https://sua-api.example/webhooks/pagamentos",
  "webhookSecurity": {
    "type": "hmac",
    "hash": "MESMO_SEGREDO_CONFIGURADO_EM_EFI_WEBHOOK_SECRET"
  },
  "processPayment": "async"
}
```

Confira com `GET /v1/config`. Esse provisionamento externo não é feito automaticamente no boot e não foi executado nesta entrega. A URL de webhook precisa ser HTTPS e acessível pela Efí. A configuração é da aplicação inteira, não de cada salão.

Aqui, `hmac` é o **segredo estático na query string** documentado pela Efí, e não uma assinatura calculada sobre o corpo. O backend compara o segredo em tempo constante. A configuração de mTLS para receber callbacks seria outra opção oficial, mas esta entrega usa o segredo na URL; mTLS continua obrigatório nas chamadas de saída.

O logger existente omite query strings. O proxy, túnel e serviços externos também precisam omiti-las; não registre URLs completas de webhook. Não inclua tokens, certificados, CPF ou respostas externas brutas nos logs. Os padrões de certificado privado foram incluídos no `.gitignore`.

## Persistência

A migração `0012_integrar_efi_homologacao.sql` adiciona à tabela existente `cobranca_gateway`:

| Campo | Motivo |
|---|---|
| `provedor` | Impedir uso de uma tentativa por outro provider; cobranças anteriores ficam identificadas como fake. |
| `pagador` (JSONB, nullable) | Congelar CPF, instituição e CNPJ opcional para que a mesma chave idempotente sempre repita a mesma requisição. |

São reutilizadas as tabelas de cobranças, eventos, vínculos de pagamento e configuração de recebimento. Não há segunda tabela financeira nem escrituração paralela. A chave da tentativa e o hash dos eventos continuam preservados. A migração adicional 0013 troca a unicidade isolada do identificador externo por `(provedor, id_externo)`, preservando o histórico. Nenhuma migração antiga foi alterada.

O CPF é necessário para iniciar o pagamento, fica no snapshot interno da tentativa e não é devolvido no response de checkout. O payload normalizado dos eventos não contém CPF, credenciais ou o segredo de webhook. Controle acesso ao banco e backups como aos demais dados pessoais do projeto.

A migração foi gerada; não foi aplicada ao banco do usuário. Após revisar, aplique pelo fluxo existente:

```bash
npm run build:schema
npm run db:migrate
```

## Contratos para a fase 2

Todos os contratos HTTP do Fluy estão em `@fluy/schema`. Os endpoints públicos resolvem o salão pelo subdomínio da rota. O cliente não escolhe `salao_id`, valor da cobrança ou favorecido no body.

| Método e rota | Uso |
|---|---|
| `GET /salao/configuracao/recebimento-pix` | Consultar recebimento; exige autenticação da dona. |
| `PUT /salao/configuracao/recebimento-pix` | Atualizar chave e nome; exige autenticação da dona. |
| `GET /publico/s/:subdominio/reservas/checkout` | Obter somente `nome_recebedor` para apresentação. Não publica a chave nem documento do salão. |
| `GET /publico/s/:subdominio/reservas/instituicoes` | Obter array de `{ id, nome }` das instituições retornadas pelo provider. |
| `POST /publico/s/:subdominio/reservas` | Reservar horário pelo contrato existente de agendamento público. |
| `POST /publico/s/:subdominio/reservas/:id/pagamentos` | Iniciar ou continuar uma tentativa de sinal/total. |
| `GET /publico/s/:subdominio/reservas/:id/pagamento?credencial=...` | Consultar o pagamento da cliente, com conciliação externa quando há identificador. |
| `POST /webhooks/pagamentos?hmac=...` | Callback externo autenticado pelo segredo. Não usa login de cliente nem tenant indicado pelo chamador. |

Cadastro de recebimento (rota já existente):

```json
{
  "tipo_chave": "email",
  "chave": "salao@example.com",
  "nome_recebedor": "Salão Exemplo"
}
```

Iniciação de pagamento:

```json
{
  "credencial": "d2e01b24-224b-4d4b-9fc7-a7da9733aa88",
  "modalidade": "sinal",
  "pagador": {
    "cpf": "51687574219",
    "instituicao_id": "9f4cd202-8f2b-11ec-b909-0242ac120002"
  }
}
```

Os identificadores e documentos do exemplo são fictícios/documentais; use os dados autorizados para o teste. CPF deve ter 11 dígitos, e o CNPJ opcional, 14. A instituição deve ser escolhida da lista atual. `pagador` permanece opcional no contrato compartilhado para compatibilidade com o fake, mas é obrigatório para iniciar uma nova tentativa com Efí. A validação definitiva da identidade/conta é do banco/provider, não da credencial de dispositivo do Fluy.

O backend calcula valores a partir da reserva e carrega o favorecido do cadastro do salão. A chave idempotente é persistida antes da chamada e também enviada como `idProprio`. Ao retentar, os dados congelados prevalecem, mesmo que o request ou cadastro tenham mudado.

O response preserva `id`, `status`, `modalidade`, `valor_salao`, `taxa_cliente`, `total_cliente`, `expira_em`, `situacao` e `instrucao_cliente`. Quando disponível:

```json
{
  "tipo": "url",
  "valor": "https://instituicao.example/authorize"
}
```

A iniciação devolve a instrução local sem consultar o banco antes da autorização. Uma consulta remota sem registros mantém o pagamento pendente. A fase 2 deverá abrir essa instrução, tratar o retorno e consultar o pagamento. **Redirect e sucesso de criação não confirmam pagamento.** Não foi criada uma tela ou rota que confirme pagamento por query string.

## Confirmação, consulta e reprocessamento

- O provider usa `GET /v1/pagamentos/pix` com intervalo de datas e procura o identificador exato, percorrendo a paginação documentada. Não inventa um endpoint de consulta individual. Links de paginação externos, ciclos e respostas inválidas são recusados; há limite de 100 páginas por consulta.
- `aceito` é normalizado para `confirmado`; `rejeitado` e `cancelado`, para `falhou`; `expirado`, para `expirado`. `pendente` não confirma nada. Status desconhecido é recusado.
- `dataCriacao` é o timestamp informado no contrato externo e usado no evento; não representa uma medição independente do instante de liquidação.
- O callback é autenticado e validado antes de persistir. O ID de evento é derivado de identificador, status e valor, pois o callback documentado não fornece ID de entrega.
- O status externo original é preservado em `tipo_bruto`, distinguindo, por exemplo, rejeição e cancelamento. O evento terminal é persistido como `recebido` antes de confirmar. O tenant é obtido por correlação interna de provider e identificador/referência, sem confiar em um salão enviado no body.
- Essa correlação e o inbox são operações de integração globais por necessidade. Depois da resolução, todas as operações financeiras continuam filtradas por salão.
- Eventos anteriores à resposta de criação podem encontrar a tentativa por `idProprio`. Eventos ainda sem correspondência ficam duráveis para reprocessamento, inclusive após reinício.
- O inbox normalizado é reprocessado independentemente do provider ativo, inclusive com pagamento online desativado. Usa a origem persistida, sem autenticar novamente ou consultar o adapter.
- Falhas de processamento ficam registradas como `falhou` com mensagem genérica; o job tenta novamente. Eventos sem correspondência giram pelo lote via `atualizado_em`, evitando bloquear os seguintes. O lote é limitado a 20 eventos.
- Evento processado, cobrança, alocações e promoção de reserva são gravados na mesma transação. Os locks existentes serializam eventos e expiração da mesma reserva. Reentregas não geram novas alocações.
- Uma resposta de criação tardia salva o identificador sem rebaixar um estado terminal. Uma confirmação tardia marca divergência e não reocupa horário liberado; a resolução financeira dessa divergência continua pendente de definição do produto.
- Divergência de valor não confirma pagamento. Não há reembolso automático nesta fase; não se presume autorização para debitar uma conta externa.
- O callback retorna 200 após persistência, mesmo se o processamento precisar de retry. Falha ao persistir não é confirmada ao provider. A entrega/reentrega externa precisa ser verificada na homologação, não presumida como garantida.

## Validação e pendências manuais

Os testes usam dados fictícios, transporte controlado, mocks e requisições HTTP em memória no Nest/Express. Nenhuma chamada à Efí, credencial real ou transação financeira é usada pela suíte.

Verificações executadas:

| Verificação | Resultado |
|---|---|
| `npm run build:schema` | Passou. |
| `npm test --workspace=backend -- --runInBand` | 81 suítes e 521 testes passaram. |
| Suítes de webhook, Efí e registro após a separação do adapter | 6 suítes e 31 testes passaram. |
| ESLint nos arquivos TypeScript alterados, incluindo testes | Passou sem erros ou avisos. |
| `npm run build --workspace=backend` | Passou. |
| `npm run typecheck --workspace=backend` | Falhou somente nos dois imports preexistentes descritos abaixo. |
| `git diff --check` | Passou. |

O typecheck padrão já encontra imports inexistentes em `src/shared/filters/__tests__/all-exceptions.filter.e2e-spec.ts`: `@/test/app-factory` e `@/test/db-clean`. Esses arquivos estão fora desta alteração.

Antes de habilitar qualquer teste manual externo:

1. Aplicar a migração no ambiente de desenvolvimento/homologação.
2. Fornecer credenciais, certificado e escopos corretos.
3. Configurar URLs da aplicação e conferir o segredo de callback.
4. Validar a comunicação TLS e a entrega HTTPS real dos callbacks.
5. Testar autorização, recusa, interrupção do retorno, duplicidade, retry após timeout e confirmação após expiração.
6. Confirmar com a Efí o modelo multi-salão, contas externas, tarifas e devoluções. O sandbox não prova habilitação em produção.

Não foi testado handshake real com o provider, concorrência em PostgreSQL real ou migração aplicada a um banco nesta execução. Os testes de repository exercitam a transação e as condições com banco controlado; não substituem essas validações.

## Fontes oficiais

Consultadas em 25/10/2026:

- [Credenciais, certificado e OAuth](https://dev.efipay.com.br/docs/api-open-finance/credenciais/)
- [Iniciação, listagem e respostas de pagamentos imediatos](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-imediatos/)
- [Configurações da aplicação](https://dev.efipay.com.br/docs/api-open-finance/configuracoes-de-aplicacao/)
- [Participantes](https://dev.efipay.com.br/docs/api-open-finance/participantes/)
- [Autenticidade e formato de callbacks](https://dev.efipay.com.br/docs/api-open-finance/webhooks/)
- [Estados documentados](https://dev.efipay.com.br/docs/api-open-finance/status/)

## Troca do provider configurado

A configuração seleciona um único provider para novas operações e autenticação de callbacks. Não há resolução simultânea de adapters. Consultar ou continuar uma cobrança de outra origem é recusado para evitar enviá-la à instituição errada.

Antes da troca, concilie tentativas e cobranças pendentes e considere notificações tardias. O reprocessamento de eventos já autenticados continua após troca ou desativação; isso não autentica novos callbacks da origem anterior. Se essa continuidade externa for necessária, será preciso resolver explicitamente o adapter de origem e manter sua configuração válida.

Identificadores de instituições no HTTP são strings opacas de até 200 caracteres. A Efí mantém a validação UUID do retorno no próprio adapter. O contrato continua específico do Pix atual: recebedor por chave e instrução de autorização por URL.

A migração `0013_isolar_identificadores_por_provedor.sql` foi gerada, mas não aplicada ao banco nesta revisão. Não houve chamadas financeiras ou acesso a certificados.

### Validação da revisão de desacoplamento

- Schema compilado e build do backend concluídos.
- Suíte completa: 82 suítes e 533 testes passaram.
- Cobertura adicional: autenticação assíncrona sobre raw body, rejeição de origem incompatível, reprocessamento após troca/desativação, filtros SQL reais por origem e identidade externa composta.
- As queries foram compiladas com cliente PostgreSQL controlado, sem abrir conexão. A constraint e a concorrência não foram exercitadas em PostgreSQL real nesta revisão.
- O typecheck continua bloqueado pelos imports preexistentes de `@/test/app-factory` e `@/test/db-clean` no teste do filtro global.
