# Preparação para testar o checkout Efí no Fluy

Verificado em 28/10/2026. Complementa [a integração existente](./efi-open-finance-integracao.md) e [o prompt de execução](../prompts/execucao-fluxo-pagamento-tdd.md). Este guia não declara produção habilitada.

## Decisões de produto confirmadas

- O salão usa sua conta bancária atual e cadastra sua chave Pix no Fluy. Recebimento direto, sem saldo intermediário nem repasse pelo Fluy. Não abrir conta bancária Efí para cada salão nesta entrega.
- A cliente arca com a tarifa adicional, discriminada no checkout antes de autorizar. O preço exato e a forma de destinar/cobrar essa tarifa dependem da contratação e capacidades da Efí; não foram confirmados.
- Pagamento confirmado depois da expiração não garante o horário. A cliente deve falar com o salão para combinar remarcação ou devolução. Não há devolução automática prometida.
- Questões técnicas são resolvidas pelo agente com os MDs e as fontes oficiais. Novas lacunas de regra de negócio ou experiência devem ser perguntadas a Rudney antes da implementação dependente.

## O que Rudney precisa providenciar

### Conta e credenciais do integrador

A documentação oficial exige uma Conta Digital Efí do integrador. Crie/configure uma aplicação com acesso à **API Pix via Open Finance**, obtenha o par de homologação Client_Id/Client_Secret e gere o certificado. O Fluy atual usa arquivo P12 e sua senha, se houver. Não basta uma única “chave de API”.

Habilite os escopos usados no backend e no provisionamento:

- gn.opb.participants.read
- gn.opb.payment.pix.send
- gn.opb.payment.pix.read
- gn.opb.config.write
- gn.opb.config.read

Guarde os valores no ambiente privado do backend. Não envie segredos pelo chat, não os coloque em código/frontend e não versione certificado ou arquivo de ambiente real. Não é necessário fornecer credencial bancária ou senha do banco da cliente.

[Fonte oficial — credenciais, escopos e certificado](https://dev.efipay.com.br/docs/api-open-finance/credenciais/).

### Configuração local do backend

Preencha um ambiente privado conforme backend/.env.example, sem sobrescrever as demais configurações:

```dotenv
NODE_ENV=development
PAYMENT_PROVIDER=efi
EFI_ENVIRONMENT=homologation
EFI_CLIENT_ID=<client_id_de_homologacao>
EFI_CLIENT_SECRET=<client_secret_de_homologacao>
EFI_CERTIFICATE_PATH=C:/certificados/efi-homologacao.p12
EFI_CERTIFICATE_PASSPHRASE=<senha_do_certificado_ou_vazio>
EFI_WEBHOOK_SECRET=<segredo_aleatorio_alfanumerico_de_64_caracteres>
```

O caminho precisa existir na máquina/processo do backend. Em hospedagem, use armazenamento privado de segredos e adapte o caminho. O segredo do webhook é gerado pelo integrador, não é o Client_Secret da Efí. Use o mesmo valor na configuração externa e no backend. Os validadores atuais aceitam 32–128 caracteres alfanuméricos; 64 é a orientação operacional do projeto.

Para desenvolvimento sem credenciais, o agente deve usar PAYMENT_PROVIDER=fake, somente em desenvolvimento. Fake valida a aplicação, não a conectividade nem a liquidação na Efí.

### URLs públicas e configuração da aplicação

Providencie domínio/ambiente de teste ou túnel HTTPS para a API receber callbacks. O agente deve implementar a rota de retorno do frontend e indicar sua URL exata; não configure uma rota fictícia como se já existisse.

O provisionamento é feito externamente, autenticado com OAuth e certificado, via PUT /v1/config:

```json
{
  "redirectURL": "https://<frontend>/<rota-de-retorno-implementada>",
  "webhookURL": "https://<api>/webhooks/pagamentos",
  "webhookSecurity": {
    "type": "hmac",
    "hash": "<mesmo_EFI_WEBHOOK_SECRET>"
  },
  "processPayment": "async"
}
```

Confira com GET /v1/config. A configuração é da aplicação, não de cada salão; trocar túnel/domínio exige conferir as URLs novamente. O agente resolve roteamento, CORS, hosts/subdomínios e recuperação do checkout. Rudney só precisa fornecer o acesso/ambiente necessário para a configuração.

O retorno inclui identificadorPagamento e pode incluir erro; esses parâmetros não confirmam pagamento. O backend consulta a situação e processa eventos autenticados. O modelo atual de callback usa o segredo estático hmac na query. Configure proxy/túnel/observabilidade para não registrar essa query. A documentação também recomenda conferir receberSemChave na API Pix; o agente deve verificar se isso se aplica ao modelo contratado e configurar com base oficial, sem mudar contas/ambientes às cegas.

Fontes: [configuração e retorno](https://dev.efipay.com.br/docs/api-open-finance/configuracoes-de-aplicacao/), [callbacks](https://dev.efipay.com.br/docs/api-open-finance/webhooks/).

### Banco de dados e teste do produto

Revise as migrations existentes e aplique as pendentes no ambiente de teste pelo fluxo versionado do projeto:

```powershell
npm run build:schema
npm run db:migrate
```

Não use db:push para atualizar banco persistente. Use salão, cliente e dados bancários de teste autorizados. Não presuma que dados fictícios de exemplos servem no sandbox: confirme as instruções oficiais para simular os estados.

O agente deve entregar um roteiro com caminhos reais de tela, pré-condições e resultados esperados. Verifique ao menos: cadastro de recebimento; sinal e total; autorização; recusa; retorno interrompido; recarga; duplicidade; pagamento de resultado incerto; expiração e confirmação tardia. Homologação só está validada após chamadas e callbacks reais; teste com mocks não substitui esse aceite.

## O que precisa ser confirmado com a Efí antes de produção

O agente deve investigar as fontes oficiais e preparar uma solicitação objetiva para Rudney encaminhar pelo canal da própria conta, sem presumir resposta favorável:

1. A aplicação do Fluy pode iniciar Pix para múltiplos salões PF/PJ, cada um recebendo em sua conta atual em outro banco, sem conta Efí individual e sem trânsito de dinheiro pelo Fluy?
2. A conta/contrato do integrador permite esse modelo? Qual habilitação comercial, cadastro/verificação do recebedor, limites ou consentimentos são exigidos?
3. Qual tarifa é cobrada, de quem, quando e de qual conta? Como a cliente pode pagá-la adicionalmente, com discriminação prévia, e como o principal chega ao salão sem criar despesa não recuperada para o Fluy?
4. Há custos por tentativa, falha ou devolução? Qual mecanismo de devolução é viável se o salão recebeu em outro banco? Não supor permissão de débito pela existência de uma chave Pix.
5. Quais requisitos e testes liberam produção e garantem callbacks/consulta nesse contrato?

A documentação pública de iniciação aceita favorecido por chave/conta, mas isso isoladamente não comprova habilitação comercial para o cenário multi-salão. A API de Abertura de Contas é outro produto: exige Conta Efí Empresas e liberação específica; não é necessária ao modelo de produto escolhido aqui e não deve ser adicionada como atalho.

Fontes: [pagamentos imediatos](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-imediatos/), [abertura de contas](https://dev.efipay.com.br/docs/api-abertura-de-contas/credenciais/), [pendências da pesquisa do projeto](./efi-open-finance-viabilidade.md).

## Estado de autorização

Código e testes do fluxo podem avançar com fake e homologação. Produção permanece bloqueada no backend atual. Não remova esse bloqueio simplesmente por existir uma tela de checkout; liberação exige comprovar o modelo financeiro, tratar as pendências e validar o ambiente.
