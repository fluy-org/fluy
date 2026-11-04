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

## Telas implementadas e retorno — 28/10/2026

- Dona: /painel/configuracao, seção Recebimento Pix. Consultar, cadastrar tipo,
  chave e nome, salvar e reabrir. Não há criação de conta bancária.
- Cliente: /s/:subdominio, catálogo → horário → revisão. Sinal positivo cria
  reserva; referências são enviadas ao mesmo agendamento antes de avançar.
- Checkout: /s/:subdominio/checkout/:id. Escolher sinal/total e preencher os
  dados de pagador quando houver instituições. Preparar não abre o banco:
  conferir principal, tarifa, total e recebedor congelados antes de clicar
  Autorizar no banco. Nenhuma senha bancária é coletada no Fluy.
- Retorno global: /retorno-pagamento. Configure redirectURL como
  https://<mesmo-origin-do-checkout>/retorno-pagamento. O MVP usa caminhos
  /s/:subdominio. Não se presume compartilhamento de localStorage entre hosts.
  O retorno oferece reservas deste navegador e não interpreta a query bancária
  como autorização ou confirmação. Em outro origin/navegador, a recuperação
  orienta voltar ao salão e consultar antes de pagar novamente.
- Contexto local é separado por salão/reserva, com vínculo SHA-256 da credencial
  de dispositivo (a credencial não é duplicada no contexto). Não guarda CPF,
  chave Pix, token do provider ou segredo de webhook. A sessão Fluy é consultada
  novamente; preços e estados do armazenamento local nunca autorizam cobrança.
- Polling: 5 segundos depois de cada consulta concluída, sem sobreposição,
  máximo de 120 consultas por acompanhamento. Sair/cancelar sessão encerra;
  retorno à tela consulta novamente. Limite atingido oferece consulta manual.
  Prazo exibido é informativo, sem cancelar o consentimento externo.
- Após timeout de iniciação: consultar ou continuar a mesma tentativa e
  modalidade, usando a idempotência do backend; não iniciar cobrança às cegas.
- Confirmado normalmente: confirmação, orientações do salão e calendário.
  Confirmado após prazo: contato WhatsApp do salão para remarcação/devolução,
  sem garantir horário nem prometer devolução automática.
- Sinal zero/gratuito: confirmação sem antecipação; restante presencial.

### Roteiro de aceite local com fake (ainda pendente no navegador)

1. Em ambiente descartável de desenvolvimento com migrations versionadas
   aplicadas, use PAYMENT_PROVIDER=fake e NODE_ENV=development. Mantenha os
   demais requisitos de autenticação/tenant e storage do projeto.
2. Acesse o salão existente ou conclua o onboarding normal do Fluy. Configure
   disponibilidade e procedimentos de teste, um com sinal positivo e outro
   com sinal zero. Cadastre o recebimento em /painel/configuracao.
3. Identifique uma cliente de teste em /s/:subdominio. Selecione procedimento,
   data/horário e referências. Clique duplo deve produzir uma única reserva;
   horário conflitante deve impedir avançar sem confirmar indevidamente.
4. Prepare sinal; confira valor do salão, tarifa e total retornados. O fake
   usa a tarifa de teste de R$ 1 já existente, não tarifa comercial Efí. O fake
   não tem instituições nem URL bancária: preparação sem pagador é aceita e
   confirmação é simulada exclusivamente pela rota autenticada da dona.
5. Com o id da cobrança recebido no POST de preparação, invoque no ambiente
   local POST /salao/pagamentos/fake/:id/simular, Bearer da dona, body
   {"resultado":"confirmado"}. Observe a tela atualizar pelo GET de consulta.
   Não há botão público de simulação nem confirmação hardcoded no checkout.
6. Em nova reserva repita para total; simule falhou e retente no prazo. Faça
   refresh e retome pela página do salão. Feche a tela durante polling.
7. Para retorno bancário, a validação externa real requer Efí em homologação;
   abrir /retorno-pagamento com query de sucesso inventada não pode confirmar.
   Consulte o mesmo pagamento para verificar confirmação recebida sem retorno.
8. Valide expiração, confirmação tardia, ausência de contexto, identificação
   trocada e duas reservas em abas diferentes. Após resultado incerto, retome
   a tentativa anterior antes de iniciar outro pagamento.
9. Confira referências e aviso de upload parcial; selecione somente imagens
   faltantes para retry. Reabra o cadastro da dona e confirme dados salvos.
10. Revalide pagamentos manuais, agenda e faturamento com as alocações de
    sinal/restante existentes. Não foram implementados reembolso automático,
    cobrança online de restante pelo painel ou link de sinal manual.

Esse roteiro não foi executado ponta a ponta no navegador nesta entrega.
Credenciais Efí não foram solicitadas, lidas ou usadas; homologação externa
não foi executada e produção permanece bloqueada. Os testes de serviços em
Jasmine/Node não substituem Karma/Chrome, PostgreSQL ou teste bancário real.
