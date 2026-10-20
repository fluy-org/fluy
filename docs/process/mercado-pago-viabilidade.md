# Mercado Pago — validação de viabilidade para o Fluy

Pesquisa em 13/10/2026. Complementa o [bloco 9](./bloco-9-pagamento-online.md).

**Resultado: candidato com pendências impeditivas; gateway ainda não escolhido.**
Há evidência oficial favorável ao marketplace em CPF, mas a combinação de
Checkout Pro, OAuth, PIX, reserva curta e reembolso sem adiantamento do Fluy
ainda precisa de confirmação do provedor e validação na conta real.

## Modelo avaliado

- Fluy operado por pessoa física no Brasil, sem CNPJ, com poucos salões.
- Cada salão é o recebedor de suas próprias cobranças e autoriza a aplicação por OAuth.
- Uma cobrança tem um único salão recebedor; não divide entre profissionais.
- Checkout Pro hospedado, inicialmente com PIX e comissão do Fluy igual a zero.
- Taxa de processamento descontada do recebimento do salão, sujeita à aceitação dessa regra.
- Nenhum recebimento centralizado no saldo do Fluy para depois repassar.

Esse desenho é uma hipótese para validação, não uma decisão de produto.

## Cadastro, CPF e KYC 6

O [artigo oficial sobre split para serviços e beleza](https://www.mercadopago.com.br/blog/split-pagamento-marketplace-servicos-beleza)
afirma que o modelo 1:1 aceita PF ou PJ tanto para marketplace quanto para
vendedores. Isso é evidência específica a favor do operador Fluy em CPF.
Os [termos para desenvolvedores](https://www.mercadopago.com.br/developers/pt/docs/resources/legal/terms-and-conditions)
também admitem PF, mas acesso à API não comprova habilitação de todo produto.

Os [pré-requisitos técnicos de split 1:1](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/prerequisites)
exigem conta de vendedor com KYC 6. A página não explica quais documentos
atingem esse nível nem distingue claramente o requisito do operador e de cada
recebedor. Não foi localizada uma definição pública suficiente para validar o
CPF concreto do Fluy. KYC 6 não deve ser traduzido automaticamente como CNPJ,
nem como simples envio de selfie. O modelo 1:N exige relacionamento comercial;
não é necessário para a hipótese de uma cobrança por salão.

**Pendente:** confirmar quais contas precisam de KYC 6, como conferir esse nível,
documentos adicionais, análise comercial, limites e eventual migração CPF → CNPJ.

## Experiência da dona do salão

A [autorização OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation)
documenta login e consentimento na página do Mercado Pago, seguidos de retorno
ao Fluy. A troca de código por tokens acontece no backend. A dona não precisa
criar aplicação nem copiar chave de API. O token pode ser renovado sem novo
consentimento; o fluxo deve proteger `state`, usar PKCE e guardar segredos no servidor.

Para uma conta ainda inexistente ou com verificação incompleta, não ficou
comprovado que cadastro, documentos, validação e retorno ao Fluy sejam uma
única jornada contínua. Isso deve ser testado no celular, incluindo retomada
após análise de identidade. A [exigência de chave PIX no Mercado Pago](https://www.mercadopago.com.br/blog/vendas-com-mercado-pago-o-que-preciso-para-vender-com-pix-no-e-commerce)
também precisa entrar no onboarding guiado. Não basta informar uma chave
que está cadastrada em outro banco; pode-se orientar uma chave aleatória no MP.

## PIX com marketplace: contradição oficial

O artigo de serviços e beleza afirma compatibilidade de split com PIX.
Porém, o [artigo oficial sobre PIX no e-commerce](https://www.mercadopago.com.br/blog/pix-mercado-pago-por-que-usar-esse-metodo-de-pagamento-no-e-commerce),
datado de 24/07/2026, inclui Checkout Pro e restringe vendas por marketplace
fora do Mercado Livre. Outra [página oficial de Checkout Transparente](https://www.mercadopago.com.br/blog/o-pix-chegou-ao-checkout-transparente-do-mercado-pago),
datada de 28/09/2026, repete a restrição para esse checkout.

A [documentação técnica de integração 1:1](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)
ainda contém uma restrição a transferências de instituições externas, sem
resolver claramente o enquadramento de PIX nesse fluxo. Não há base suficiente
para afirmar que essas restrições são apenas texto desatualizado.

**Bloqueio:** confirmar Checkout Pro + OAuth de vendedor + PIX pago por banco
externo, inclusive com comissão zero. Não extrapolar suporte de uma cobrança
com credenciais próprias para suporte de marketplace.

## Taxas, recebimento e responsabilidade

O guia técnico 1:1 descreve a taxa do Mercado Pago debitada do vendedor antes
da comissão do marketplace. A documentação de [preferências usadas em Bricks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/payment-submission/wallet-credits)
informa que `marketplace_fee` tem padrão zero na API de preferências. O parâmetro
é valor em moeda, não percentual. Validar o resultado no Checkout Pro real.

A [página comercial de checkout](https://www.mercadopago.com.br/ferramentas-para-vender/check-out)
anuncia PIX de 0,99% e liberação na hora. É referência, não comprovação da
tarifa da conta conectada. Confirmar mínimos, limites, tarifas adicionais,
arredondamento e condições de reembolso na modalidade efetivamente habilitada.
Exemplo ilustrativo nessa taxa: sinal de R$ 100 deixa R$ 99,01 para o salão e
R$ 0 de comissão para o Fluy. O salão deve conhecer o valor líquido.

O recebimento ocorre na **conta Mercado Pago do salão**. Não foi comprovado
saque automático para a chave PIX de outro banco nesse produto. Se o requisito
for receber no banco habitual sem ação manual, isso permanece pendente.

Comissão zero e cobrança na conta do salão reduzem a necessidade de dinheiro
passar pelo Fluy. Não comprovam ausência de responsabilidade por perdas.
Os termos de desenvolvedores atribuem responsabilidades pelo aplicativo e
pelo uso da API; não foi encontrada garantia específica de que dívidas dos
recebedores nunca possam ser cobradas do operador. Solicitar a regra contratual.

## Reembolsos e cancelamentos

O guia 1:1 diz que o reembolso é descontado proporcionalmente das partes e
pode falhar se o vendedor não tiver saldo. Os [reembolsos do Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/refunds-and-cancellations)
exigem fundos e têm janela de até 180 dias após aprovação. Pagamento pendente
é cancelado; pagamento aprovado exige devolução.

Consequência para o Fluy: não prometer reembolso automático sempre concluído
se o salão pode sacar o dinheiro antes. É preciso resolver o caso de saldo
insuficiente, sem marcar devolução rejeitada como concluída. Uma reserva de
saldo, retenção até atendimento ou outra solução depende de disponibilidade
e contratação do provider; nenhuma está confirmada para este modelo.

O [material oficial sobre estornos](https://vendedores.mercadolivre.com.br/nota/como-fazer-estorno-de-dinheiro-com-o-mercado-pago)
menciona não cobrar tarifa de pagamento devolvido, mas mistura outros produtos
e prazo diferente. Confirmar devolução integral/parcial de tarifa no checkout
1:1. Não usar essa página para calcular automaticamente os custos do Fluy.

Se cartão entrar depois, reavaliar contestações e proteção para serviços.
Mesmo começando com PIX, confirmar devoluções por fraude e bloqueios de saldo.

## Reserva de horário e vencimento da cobrança

O desenho atual usa reserva curta, normalmente 15 minutos. O Checkout Pro tem
[vigência de preferência](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/term-of-preference)
e [vencimento do pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/expiration-date)
como configurações distintas. Não assumir que expirar o link invalida um QR
PIX já emitido. A página de vencimento mistura PIX e pagamentos offline,
recomenda dias e menciona devolução na conta MP do pagador após pagamento tardio.

A [documentação PIX via Payments API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix)
informa mínimo de 30 minutos para `date_of_expiration`. Esse limite pertence
à integração documentada e não comprova o limite do Checkout Pro.

**Pendente:** prazo mínimo real do Pro, cancelamento de PIX pendente, validade
do QR após cancelamento e destino da devolução de PIX de comprador sem conta MP.
O Fluy precisará preservar a referência financeira e tratar pagamento tardio,
duplicado e corrida entre confirmação e liberação do horário. A proposta de
excluir a reserva precisa ser revista para não perder essa rastreabilidade.

## Pré-requisitos técnicos e validação

A [configuração do marketplace](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/create-configuration)
exige aplicação no modelo Marketplace e URL de retorno. A [ativação de credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials)
pede ramo, website e aceite dos termos. A [entrada em produção](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/go-to-production)
exige HTTPS. Esses passos não substituem a aprovação específica da conta.

Há documentação separada de Checkout Pro via Preferences e via Orders.
O guia 1:1 pesquisado usa `/checkout/preferences` e tokens de cada vendedor;
confirmar a família suportada antes de definir SDK e contratos. Não misturar
requisitos de Wallet Connect, pagamentos próprios ou split 1:N com este modelo.

Os [webhooks de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications)
oferecem assinatura de origem e consulta do pagamento. A implementação deve
validar assinatura, recebedor, valor, moeda e referência; retorno do navegador
não comprova pagamento. Processamento idempotente, conciliação e isolamento
por salão são necessários. Tratar token revogado e reconexão: [gerenciamento de tokens](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/security/oauth/management).

As [compras de teste do Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/integration-test/test-purchases)
documentam PIX offline mantendo estado pendente. Gerar QR em sandbox não
comprova pagamento real, liquidação ou habilitação do CPF em produção.

Relatos públicos localizados não comprovam, juntos, operador brasileiro PF,
KYC 6 e esse fluxo em produção. Um [pedido de correção no 99Freelas](https://www.99freelas.com.br/project/correcao-de-split-no-pix-node-js-707713)
relata problema com `application_fee` em PIX; é experiência individual em
outro fluxo, não definição das capacidades do Checkout Pro. Reforça a
necessidade de validar a combinação exata, não só copiar uma integração.

## Perguntas prontas para o suporte técnico

Contexto: Fluy é um SaaS brasileiro de agendamento para salões, inicialmente
operado em CPF, sem CNPJ. Queremos conectar recebedores CPF/CNPJ por OAuth,
criar Checkout Pro em nome de cada salão, aceitar PIX de qualquer banco e não
cobrar comissão. Não queremos receber o bruto nem adiantar reembolsos.

1. Essa combinação está liberada em produção para operador CPF? Quais contas
   precisam de KYC 6, como verificamos esse nível e quais documentos/análises
   adicionais são necessários? Há contrato comercial ou mínimo de volume?
2. PIX de banco externo funciona no Checkout Pro 1:1 com OAuth e comissão
   zero? Qual API devemos usar? Como conciliar as restrições de marketplace
   existentes nas páginas oficiais com o artigo que afirma compatibilidade?
3. Uma dona sem conta pode criar, validar identidade, autorizar e retornar ao
   Fluy no mesmo fluxo? Como conduzir cadastro de chave PIX e retomada após KYC?
4. Qual tarifa efetiva, mínimo e limite valem para cada salão PF/PJ? A taxa é
   sempre debitada do salão? Há custos de integração, split ou devolução?
5. Há qualquer obrigação do operador de cobrir saldo negativo, fraude,
   contestação ou reembolso sem fundos do salão? Qual cláusula rege isso?
   Existe mecanismo que garanta devolução sem adiantamento do Fluy?
6. Quais taxas retornam em reembolso integral/parcial de PIX? Como reembolsar
   após saque, bloqueio de conta ou revogação OAuth? Qual prazo e destino para
   comprador que pagou de outro banco e não tem conta MP?
7. É possível invalidar definitivamente o PIX após 15 minutos no Pro?
   Expirar a preferência invalida QR existente? Como cancelar pendente e
   tratar confirmação simultânea/tardia sem confirmar horário já liberado?
8. O saldo pode ir automaticamente para banco externo do salão? Quais limites
   e prazos de liberação/retenção aplicam? Como migrar a aplicação de CPF para
   CNPJ posteriormente sem reconectar todos os salões?

Canal: [suporte técnico Mercado Pago Developers](https://www.mercadopago.com.br/developers/pt/support).
Perguntas preparadas; nenhuma mensagem enviada ao provedor nesta pesquisa.

## Critério para liberar a implementação

- [ ] Resolver com resposta do suporte a elegibilidade CPF/KYC e PIX em marketplace.
- [ ] Definir risco financeiro, falta de saldo em reembolso e taxa aceita pelo salão.
- [ ] Confirmar se recebimento no saldo MP atende ao produto.
- [ ] Validar cadastro e autorização guiados com uma dona PF e uma conta PJ, se PJ entrar no MVP.
- [ ] Definir API, prazo de reserva e regra de pagamento tardio compatíveis.
- [ ] Fazer prova pequena em produção, com contas reais elegíveis e valores autorizados:
      PIX de banco externo, recebedor correto, líquido/tarifa, comissão zero,
      webhook, devolução e vencimento de QR já emitido.
- [ ] Testar no Fluy confirmação concorrente com expiração, repetição de eventos,
      múltiplas tentativas, reembolso rejeitado e desconexão do salão.

Pesquisa pública concluída; habilitação de contas e prova em produção não
foram realizadas. Não há garantia de viabilidade integral só com a documentação.
