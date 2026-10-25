# Efí Open Finance — validação do fluxo do Fluy

Pesquisa em 13/10/2026. Complementa o [bloco 9](./bloco-9-pagamento-online.md)
e a [comparação de gateways](./gateways-alternativos-viabilidade.md).

**Resultado: não liberado para implementação completa.** CPF tem respaldo
documental, mas recebimento em banco externo, custo dessa modalidade e
devolução sem adiantamento da plataforma não foram comprovados. Pesquisa
pública não substitui habilitação da conta e teste real.

## Correção do grau de certeza do fluxo anterior

O desenho desejado continua sendo: salão informa chave PIX no Fluy; cliente
autoriza pagamento no banco; salão recebe na sua conta atual; Fluy confirma.
Porém, o suporte confirmar "conta de terceiros" não comprova, por si só,
conta mantida em outro banco. Terceiro também pode ser outro titular na Efí.

O exemplo da resposta favorável para SaaS usa o código bancário `09089356`,
da própria Efí. O formulário da API aceitar dados bancários também não
comprova que todo banco esteja liberado em produção.

## 1. Banco externo do salão — pendência impeditiva

A [resposta de 07/01/2025 para um SaaS](https://comunidade.sejaefi.com.br/discussao/implementacao-api-recebimento-direto-saas-55)
confirma iniciação para terceiros, mas não demonstra uma transação liquidada
em outra instituição. Existem outras respostas que restringiam o recebimento:

- [30/08/2022](https://comunidade.sejaefi.com.br/discussao/estornos-destino-recursos-pix-openfinance-42):
  equipe informava recebimento apenas em contas Gerencianet (atual Efí).
- [16/11/2023](https://comunidade.sejaefi.com.br/discussao/recebimento-pagamentos-efi-transferencia-bancos-20):
  equipe anunciava, ainda como novidade futura, "OpenFinance ITP Puro" para
  permitir favorecido em outra instituição.
- [02/08/2024](https://comunidade.sejaefi.com.br/discussao/uso-api-pix-tarifas-recebimentos-0):
  equipe dizia que não era possível receber em outros bancos. A pergunta
  mistura API Pix e Open Finance, então não é prova de proibição atual.

Não foi localizada confirmação pública suficiente de lançamento, contratação,
tarifa e acesso em CPF do ITP Puro. As fontes antigas são sinais de restrição
histórica, não prova de que o produto continua indisponível em 2026.

**Para liberar:** confirmar que uma única aplicação do Fluy em CPF pode
iniciar PIX para múltiplos salões PF/PJ com contas em bancos externos, sem
conta Efí individual, API key do salão ou recebimento no saldo do Fluy.

## 2. CPF do operador — favorável, com escopo específico pendente

Os [termos da API Open Finance](https://dev.efipay.com.br/pdfelement/Termos_e_condicoes_de_uso_API_Open_Finance.pdf)
admitem integrador PF/PJ. A [equipe na comunidade](https://comunidade.sejaefi.com.br/discussao/acesso-apis-contas-cnpj-cpf-efi-pro-38)
confirma as APIs Pix, Cobranças e Open Finance em conta Efí Pro CPF.
Os [termos da conta Pro](https://sejaefi.com.br/termos-de-uso-efi-pro) definem
essa modalidade para PF sem CNPJ, mas permitem exigir mudança para PJ
conforme ramo, volume e valores.

Isso sustenta acesso em CPF; não comprova aprovação da operação multi-salão
com recebedores externos. Solicitar critérios de enquadramento, contrato de
parceiro, habilitação de produção e limites aplicáveis ao Fluy.

**Produto diferente:** a [API Abertura de Contas](https://dev.efipay.com.br/docs/api-abertura-de-contas/credenciais/)
exige Conta Efí Empresas e liberação restrita. Não é uma alternativa comprovada
para criar contas guiadas dos salões mantendo o Fluy em CPF.

## 3. Tarifa sem perdas para o Fluy — pendência impeditiva

A [tabela de tarifas](https://sejaefi.com.br/tarifas) publica 1,19% para
recebimentos Pix e ressalva variação por contratação/negociação. Respostas da
equipe citam esse mesmo percentual para Open Finance. Isso não estabelece a
tarifa do ITP Puro nem como ela é cobrada quando o favorecido está em outro banco.

Em recebimento externo, não presumir que o salão recebe automaticamente o
valor líquido. Não foi documentado um desconto de tarifa nessa conta externa.
Se o provider faturar a plataforma separadamente, o Fluy precisará de forma
confiável de recuperar esse custo, além de definir arredondamento, mínimos,
custos de falhas e devoluções. Cobrar do salão depois cria risco de inadimplência.

Perguntar: quanto custa, quem é debitado, quando e de qual conta? Qual valor
chega ao recebedor? Há desconto automático, mensalidade, mínimo de volume,
tarifa por tentativa, ou custo não recuperável em devolução?

## 4. Devolução automática — pendência impeditiva

A [API de pagamentos imediatos](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-imediatos/)
oferece devolução por identificador e valor, com estado pendente e erro de
saldo insuficiente. Não esclarece a conta debitada no cenário de recebedor externo.

O cadastro da chave de recebimento não dá ao Fluy autorização geral para
debitar a conta do salão. A existência do endpoint não demonstra que a Efí
controle o dinheiro depositado em outra instituição.

**Para liberar:** a Efí precisa explicar se essa devolução atende pagamentos
externos, quais credenciais/consentimentos exige, de onde saem os fundos e
como funciona após saque. Se exigir saldo ou adiantamento do Fluy, conflita
com o requisito financeiro atual. Uma devolução manual pelo salão mudaria o
fluxo definido no bloco 9 e precisa de decisão explícita de produto.

## 5. Reserva curta — compatibilidade não comprovada

Os [status do Open Finance](https://dev.efipay.com.br/docs/api-open-finance/status/)
incluem pendente, aceito, rejeitado, cancelado e expirado. Expirado refere-se
a link de retorno gerado e não utilizado; não comprova controle do prazo pelo Fluy.

No guia de pagamento imediato não foi localizado campo de vencimento
configurável nem endpoint de cancelamento. Existe cancelamento em
[pagamentos agendados](https://dev.efipay.com.br/docs/api-open-finance/pagamentos-agendados/),
que é outro fluxo e não substitui pagamento imediato de sinal.

Confirmar validade do link/consentimento, eventual API de cancelamento
imediato e possibilidade de autorização tardia. O Fluy precisa de regra para
pagamento confirmado após liberar o horário. Expirar apenas a reserva local
não assegura que o provider rejeite a transação.

## 6. Cobertura e experiência da cliente

O banco do pagador precisa participar da modalidade de pagamentos atendida.
A Efí fornece [consulta de participantes](https://dev.efipay.com.br/docs/api-open-finance/participantes/).
Essa lista deve ser obtida em produção; não prometer todos os bancos por
inferência da popularidade do PIX. Cobertura do pagador é uma questão
diferente da permissão para bancos recebedores externos.

O fluxo imediato requer identificação do pagador e seleção de instituição,
seguida de autorização no ambiente bancário e retorno. É preciso testar
celular, troca de app, navegador, recusa, CPF do pagador e bancos dos clientes
iniciais. Gerar uma imagem PIX estática diretamente no Fluy seria outra
solução e não forneceria, sozinha, confirmação automática para qualquer banco.

## 7. Integração, confirmação e responsabilidade

As [credenciais](https://dev.efipay.com.br/docs/api-open-finance/credenciais/)
exigem conta Efí do integrador, aplicação, escopos e certificado mTLS.
Os [webhooks](https://dev.efipay.com.br/docs/api-open-finance/webhooks/)
documentam mTLS ou identificação secreta na URL, confirmação de pagamento e
devolução. O sandbox simula resultados, portanto não comprova permissão de
recebimento externo em produção. Retorno do navegador não substitui consulta
do estado financeiro.

Os termos atribuem à Efí o serviço de iniciação e ao integrador a segurança
da aplicação, credenciais e autorizações. Não foi localizada garantia de
ausência total de responsabilidade financeira do operador no cenário
multi-salão. Solicitar as condições específicas sobre fraude, devoluções,
bloqueios e erros operacionais.

## Pergunta principal para o suporte

> O Fluy é um SaaS de agendamento de salões, inicialmente operado em CPF,
> com dois potenciais recebedores. Queremos usar uma aplicação Efí Pro para
> iniciar PIX imediatos dos clientes diretamente às contas PF/PJ dos salões
> em outros bancos, por chave PIX ou dados bancários. Não haverá comissão,
> recebimento no saldo do Fluy nem repasse posterior. O salão não terá conta
> Efí ou credenciais técnicas. Essa operação está habilitada em produção?
> É o produto ITP Puro? Quais contratos, aprovações e limites são exigidos?
> Como a tarifa é paga e de qual conta sai uma devolução por API? É possível
> cancelar/expirar a iniciação em 15 minutos? Há responsabilidade do operador
> por fraude ou falta de saldo do recebedor?

Canal técnico público: [comunidade Efí](https://comunidade.sejaefi.com.br/comunidade).
Pergunta preparada; nenhuma comunicação foi enviada ao provider.

## Critério para começar

- [ ] Confirmar produção em CPF para múltiplos recebedores em bancos externos.
- [ ] Fechar tarifa, conta debitada e recuperação automática do custo.
- [ ] Resolver devolução sem adiantamento do Fluy.
- [ ] Compatibilizar reserva de horário com consentimento e pagamento tardio.
- [ ] Validar bancos e experiência dos clientes iniciais.
- [ ] Fazer prova isolada em produção com contas e valores autorizados:
      dois recebedores externos, titular correto, confirmação, custo efetivo,
      devolução, cancelamento/expiração e erro de saldo.

Até esses pontos serem resolvidos, o desenho "dona cadastra a chave e recebe
no banco atual" permanece uma hipótese de integração, não capacidade garantida.

## Atualização de implementação — 25/10/2026

Foi aprovada a implementação do backend **exclusivamente para homologação**,
com produção bloqueada até resolver recebimento externo e tarifas. Isso não
encerra as pendências desta pesquisa nem comprova a capacidade comercial.
Veja [integração e contratos da fase 1](./efi-open-finance-integracao.md).
