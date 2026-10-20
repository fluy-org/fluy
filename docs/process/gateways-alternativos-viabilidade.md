# Gateways alternativos — viabilidade para o Fluy

Pesquisa em 13/10/2026. Complementa o [bloco 9](./bloco-9-pagamento-online.md)
e a [avaliação do Mercado Pago](./mercado-pago-viabilidade.md).

**Resultado:** InfinitePay Checkout Integrado e Efí Open Finance merecem
validação prioritária. Nenhuma alternativa foi comprovada para todos os
requisitos de produção do Fluy. A escolha do gateway permanece em aberto.

## Critérios usados

- Operador Fluy em CPF, sem CNPJ, com aproximadamente dois salões iniciais.
- Salões PF/PJ ativam recebimento em jornada guiada; não criam aplicações
  técnicas nem copiam chaves de API.
- Cliente paga com PIX e o salão recebe automaticamente.
- Fluy não recebe o bruto para depois repassar, não lucra com a cobrança e
  precisa de condições claras sobre taxas e responsabilidade por perdas.
- Sinal confirma reserva curta; vencimento libera horário com segurança.
- Cancelamento pelo salão precisa permitir devolução conforme a regra de produto.

Cobrança simples, split, abertura de contas BaaS e iniciação Open Finance são
produtos distintos. Uma conta PF comum não comprova habilitação de uma
plataforma PF para operar recebedores de terceiros.

## Comparação

| Provedor / produto | Ativação do salão | Fluy sem CNPJ | Principal restrição | Avaliação |
|---|---|---|---|---|
| InfinitePay Checkout Integrado | Cadastro CPF/PJ, habilitar checkout e informar InfiniteTag; dá para orientar no Fluy | A API pública não descreve conta central obrigatória; autorização comercial do uso com vários salões precisa ser confirmada | Não foi localizada API pública de devolução nem expiração de checkout/QR para reserva de 15 min | Prioridade para cobrança simples com checkout hospedado |
| Efí Open Finance | Salão informa chave PIX ou conta bancária; cliente autoriza pagamento no banco | API disponível em Efí Pro CPF; uso específico pelo Fluy depende de confirmação | Tarifa para recebedor externo, devolução e seu saldo de origem, cancelamento e prazo curto não ficaram esclarecidos | Prioridade se receber no banco habitual for essencial |
| PagBank Connect | Conta PF/PJ e autorização para aplicação; cadastro API disponível a parceiros | Não confirmado para operador CPF no produto pretendido | Homologação, parceria e validação no app para movimentar saldo | Alternativa adicional; sem evidência suficiente de vantagem global |
| Woovi BaaS | Link hospedado com KYC e retorno; abre contas PF/PJ | Contrato público define parceira PJ | Responsabilidade por fraude de usuários e tarifas de contas PF cobradas da plataforma | Bom encaixe técnico; não atende às condições atuais |
| Asaas BaaS | Cadastro e documentos pelo fluxo da plataforma | Conta-pai obrigatoriamente CNPJ | Habilitação comercial e avaliação regulatória | Reavaliar se Fluy se formalizar |
| iugu Marketplace | Subcontas criadas e verificadas pela plataforma | Conta mestre sempre PJ | Plano Marketplace e contratação | Não atende ao CPF do operador |
| Safe2Pay Marketplace | Subcontas PF/PJ por API, com configuração de tarifa e repasse | Materiais contratuais públicos diferem; não confirmado | Marketplace pode responder por devoluções que a subconta não realizar | Desfavorável à restrição financeira do Fluy |
| AbacatePay | Conta simples para cobrar vendas próprias | Não resolve o fluxo multi-salão apenas com cadastro | Página oficial de marketplaces informa split ainda em breve | Não escolher para esta necessidade agora |
| Paytime | Cadastro de estabelecimento e infraestrutura de marketplace | Fluxos públicos de contratação/homologação pedem CNPJ | Relacionamento comercial e homologação | Sem vantagem comprovada para dois salões e operador CPF |
| Intake Finance | Documenta BaaS, split e subcontas | Não comprovado | Contrato, parceiro custodiante, limites e responsabilidade financeira não foram suficientemente verificados | Fora da lista prioritária por falta de evidência, não por porte |

As justificativas e fontes estão nas seções abaixo. "Não confirmado" significa
insuficiência de evidência para o modelo exato; não é uma afirmação de proibição.

## InfinitePay: checkout simples com recebimento do próprio salão

A [documentação de checkout](https://www.infinitepay.io/checkout-documentacao)
apresenta geração de link com `handle` (InfiniteTag), referência do pedido,
retorno, webhook e consulta `payment_check`. O exemplo não requer que o salão
copie API key. Isso permite avaliar uma integração por recebedor, sem comissão
ou recebimento centralizado no Fluy.

A [central de ajuda](https://ajuda.infinitepay.io/pt-BR/articles/10766888-como-usar-o-checkout-integrado-da-infinitepay)
exige habilitar Checkout Integrado no app ou web e menciona marketplaces entre
os usos. Isso não é um onboarding OAuth pronto. A experiência proposta seria
o Fluy orientar cadastro, habilitação e identificação do recebedor. Há um
[cadastro específico de checkout com opção CPF](https://buy.infinitepay.io/cadastro/onboarding/checkout-integrado/celular).
Verificar disponibilidade real da função em contas PF aprovadas.

O [produto anuncia PIX grátis e ausência de volume mínimo](https://www.infinitepay.io/checkout).
Confirmar a condição no contrato e no piloto, incluindo eventual custo de
parceria. O cliente usa checkout hospedado; o dinheiro pertence à conta do
salão, não a um saldo administrado pelo Fluy. Saque automático para banco
externo não foi comprovado.

Limites encontrados: não foi localizada documentação pública de API de
reembolso, cancelamento de checkout pendente ou expiração de QR em 15 minutos.
A [devolução PIX documentada](https://ajuda.infinitepay.io/pt-BR/articles/10572395-como-cancelar-uma-transacao-pix)
ocorre pelo app do recebedor, exige saldo e permite devolução total/parcial
em até 90 dias. Isso não comprova reembolso automático pelo Fluy.

Um [manual público de outro SaaS](https://meubrecho.net/ajuda/vendas) descreve
integração por InfiniteTag, recebimento direto ao lojista e confirmação
automática. É experiência publicada pelo próprio integrador, sem comprovação
independente de volume, estabilidade ou habilitação do operador em CPF.

**Prioridade:** validar simplicidade e custo do checkout. Não escolher para
todo o bloco 9 sem resolver devolução, prazo de reserva e autorização de
uso da API pelo Fluy em nome de vários salões.

## Efí: iniciação de PIX para a conta bancária do salão

**Ressalva da investigação aprofundada:** veja [viabilidade da Efí](./efi-open-finance-viabilidade.md).
"Conta de terceiros" não comprova banco externo: o exemplo favorável usa a
própria Efí, e há restrições históricas e anúncio de ITP Puro sem confirmação
pública suficiente da liberação para o Fluy. O fluxo abaixo é hipótese.

A [documentação de pagamentos imediatos](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-imediatos/)
aceita favorecido por chave PIX, conta bancária ou QR. Retorna URL para o
cliente autorizar no banco. Também lista consulta e devolução por API, com
erro possível de saldo insuficiente.

Os [termos da API Open Finance](https://dev.efipay.com.br/pdfelement/Termos_e_condicoes_de_uso_API_Open_Finance.pdf)
admitem integrador PF/PJ. Na [comunidade oficial](https://comunidade.sejaefi.com.br/discussao/acesso-apis-contas-cnpj-cpf-efi-pro-38),
um representante Efí confirma Open Finance para contas Efí Pro CPF. Uma
[resposta específica para SaaS](https://comunidade.sejaefi.com.br/discussao/implementacao-api-recebimento-direto-saas-55)
confirma iniciação para conta de terceiros. São evidências favoráveis ao
Fluy em CPF, mais específicas que a existência de conta PF comum.

Fluxo possível: dona informa recebedor no Fluy; cliente escolhe banco e
autoriza o sinal; pagamento chega ao banco indicado; Fluy confirma via
[webhook](https://dev.efipay.com.br/docs/api-open-finance/webhooks/).
Não é envio de PIX a partir do saldo do Fluy, e não exige credenciais
técnicas da dona. Escolha do banco e identificação do pagador acrescentam
etapas em comparação ao PIX copia e cola tradicional.

Há pendências determinantes:

- Habilitação do uso em SaaS multi-salão pelo operador CPF em produção,
  incluindo recebimento em instituições externas (ITP Puro).
- Cobrança e responsável pela tarifa quando o favorecido está em outro banco;
  a referência de 1,19% veio de resposta de 2025, não de proposta atual.
- A API de devolução não explica suficientemente qual saldo é debitado se
  o recebedor original está fora da Efí. Não presumir débito automático do
  banco do salão nem autorização para movimentar esse saldo.
- Cancelamento da iniciação pendente, validade do consentimento e tratamento
  de aprovação tardia em relação à reserva de 15 minutos.
- Bancos suportados, experiência no celular e responsabilidade contratual.

Este caminho merece validação se receber no banco atual do salão for
essencial. Não ficou comprovado que mantenha reembolso automático sem
adiantamento do Fluy.

Outra solução Efí, a [API Abertura de Contas](https://dev.efipay.com.br/docs/api-abertura-de-contas/credenciais/),
é restrita, está documentada como beta e exige Conta Efí Empresas. Não usar
a disponibilidade de Open Finance em CPF para supor acesso a essa API.

## Por que as alternativas com subcontas não venceram

**Woovi:** o [KYC hospedado PF](https://developers.woovi.com/en/docs/baas/kyc/kyc-api-onboarding-conta-pf)
tem link e retorno, mas precisa de liberação e cobra as tarifas da conta PF
na conta padrão da empresa. O [contrato BaaS](https://woovi.com/politicas/parceria-baas/)
define a contratante como PJ e atribui à parceira responsabilidade integral
por fraudes dos usuários. Portanto, abertura de conta PF para a dona não
equivale a contratação BaaS pelo Fluy em CPF nem a ausência de risco financeiro.

**Safe2Pay:** [subcontas por API](https://developers.safe2pay.com.br/docs/mkt-criar-subconta)
permitem PF/PJ e gerenciamento técnico pelo marketplace. Porém, os
[termos públicos](https://publico.safe2pay.com.br/juridico/termos-de-uso.pdf),
cláusulas 3.8 e 6.2–6.3, atribuem responsabilidade ao marketplace por obrigações
das subcontas e devoluções. Outro [modelo contratual público](https://app-site-s2p-bff-prod.azurewebsites.net/v2/Documents/UseTerms)
define contratante PJ. A versão aplicável deve ser confirmada; não recomendar
com base em uma versão PF antiga sem comparar o contrato oferecido.

**Asaas:** [criação de subcontas](https://docs.asaas.com/docs/criacao-de-subcontas)
exige conta-pai PJ. O [BaaS](https://docs.asaas.com/docs/cria%C3%A7%C3%A3o-de-subcontas-baas)
resolve credenciais nos bastidores, mas requer habilitação e avaliação.
**iugu:** o [glossário](https://dev.iugu.com/docs/glossario) define titulares de
conta mestre sempre PJ; o [recurso marketplace](https://dev.iugu.com/reference/baas-criar-conta)
depende de plano compatível.

**AbacatePay:** a [página de marketplaces](https://www.abacatepay.com/para/marketplaces)
informa split em breve. **Paytime:** [contratação](https://contratar.paytime.com.br/)
e [homologação](https://docs-parceiro.paytime.com.br/docs/homologa%C3%A7%C3%A3o)
pedem CNPJ. **Intake:** [documenta APIs](https://docs.intake.finance/docs), mas
faltou evidência suficiente sobre a contratação e infraestrutura aplicáveis.

**PagBank:** [Connect é obrigatório para plataformas](https://developer.pagbank.com.br/docs/primeiros-passos)
e há [cadastro de recebedores PF/PJ por API](https://developer.pagbank.com.br/docs/cadastro-de-clientes).
Ainda exige homologação, e movimentar saldo pode depender da validação do
titular no app. Não foi confirmada a elegibilidade CPF do operador no modelo
exato; não tratar CPF do vendedor como resposta a essa dúvida.

## Confiabilidade e critério de decisão

Efí, CloudWalk (operadora InfinitePay) e Woovi constam nas bases públicas do
Banco Central: [Efí](https://www.bcb.gov.br/fis/tarifas/htms/09089356.asp?frame=1),
[CloudWalk](https://www.bcb.gov.br/fis/tarifas/htms/18189547a.asp?frame=1&seg=bancossegmento11),
[Woovi](https://www.bcb.gov.br/fis/tarifas/htms/54811417.asp?frame=1).
Documentação de produção, identidade contratual e suporte técnico também
foram considerados. Não houve auditoria de solvência ou medição de uptime.
Cadastro regulatório não garante disponibilidade, bom suporte ou contrato
favorável ao Fluy. Um gateway que opera por parceiro também pode ser viável,
desde que custodiante, titularidade e responsabilidades estejam documentados.

Recomendação para esta fase:

1. Validar InfinitePay para cobrança simples com checkout hospedado e baixo custo.
2. Validar Efí Open Finance se a prioridade for conta bancária atual do salão.
3. Exigir resposta para devolução e expiração antes de escolher qualquer uma
   para o bloco 9 completo. Mercado Pago permanece como referência de comparação.
4. Reavaliar BaaS com CNPJ se a formalização do Fluy ocorrer, sem presumir que
   CNPJ elimine os riscos dos contratos.

## Perguntas para a validação das duas prioridades

Para ambas: Fluy é um SaaS de salões, operador CPF, poucos recebedores CPF/PJ,
PIX, zero comissão, sem receber o bruto ou adiantar devoluções. Confirmar
formalmente produto, aprovação de produção, limites, tarifas, bloqueios,
responsabilidade por fraude e migração futura para CNPJ.

**InfinitePay:** pode usar um `handle` por salão? Precisa de contrato/parceria?
Há ligação guiada/verificação do titular sem chave de API? Checkout PF aceita
PIX com tarifa zero? Existem APIs privadas ou públicas para devolver e expirar
pagamento em 15 minutos? Qual autenticação garante webhook e consulta? O dinheiro
pode ir automaticamente a outro banco? Quem responde por perdas do recebedor?

**Efí:** Open Finance em conta Pro CPF está habilitado para iniciar pagamentos
em nome deste SaaS a recebedores externos? Quem paga e como se cobra a tarifa?
De qual conta sai a devolução por API nesse cenário? Precisa de novo consentimento
do salão? Pode cancelar consentimento pendente no prazo da reserva? Quais bancos
e limites atendem? É necessário contrato de parceiro além dos termos da API?

Depois dessas respostas, a prova de produção deve verificar titular correto,
PIX vindo de outro banco, líquido e custo real, notificação, vencimento e
devolução sem débito indevido no Fluy. Nenhuma conta, mensagem ao provedor ou
transação foi criada nesta pesquisa.
