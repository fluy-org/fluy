# Diagnóstico seguro de falhas Efí

O processo iniciar não valida o certificado: o P12 só é lido na primeira
requisição. Sua existência não comprova formato, senha, validade nem vínculo
com o ambiente. O transporte espera bytes P12, não texto Base64 ou PEM.

`EFI_ENVIRONMENT=production` seleciona `openfinance.api.efipay.com.br`;
o padrão `homologation` seleciona `openfinance-h.api.efipay.com.br`.
`NODE_ENV=production` não seleciona automaticamente o ambiente bancário.
OAuth usa POST `/v1/oauth/token`, Basic Auth e JSON client_credentials;
instituições usa GET `/v1/participantes?modalidade=pagamentos` com Bearer.
Ambas as chamadas usam o certificado mTLS. Conferir credenciais, certificado
e permissão `gn.opb.participants.read` da aplicação/ambiente pretendidos.

## Evidências após publicação autorizada

Reproduzir apenas a consulta de instituições, sem iniciar pagamento.
Procurar `efi_transport_falha` e `efi_client_falha` na mesma janela de tempo:

- `leitura_certificado` + ENOENT/EACCES: caminho inexistente ou acesso negado.
- `conexao_mtls` + `p12_senha_ou_integridade`: verificar senha e integridade.
- `p12_formato_invalido`: conferir bytes originais; não renomear Base64 para P12.
- Códigos de certificado/TLS: conferir validade, cadeia e ambiente.
- `resposta_http` com operação `oauth` e 401: revisar credenciais/ambiente.
- 403: verificar permissões/habilitação com a Efí; não presume causa única.
- `instituicoes`: OAuth passou, falha aconteceu na consulta da API.
- `erro_nao_classificado`: diagnóstico ainda insuficiente; não imprimir o erro
  bruto como atalho. Ampliar a classificação com códigos controlados e testes.

Os eventos mostram ambiente, etapa, operação fixa, tipo e código permitido,
além de status HTTP externo quando disponível. Não registram URL/query,
headers, token, corpo, caminho, mensagem ou stack do erro externo.
O erro público permanece genérico. Nenhuma transação real é necessária.

Não alterar ambiente/credenciais automaticamente nem desabilitar validação TLS.
Compartilhar somente os campos sanitizados; não fornecer P12, senha ou segredo.

Referência: https://dev.efipay.com.br/docs/api-open-finance/credenciais/
