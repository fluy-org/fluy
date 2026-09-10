# Provedores externos

Cada subpasta adapta um SDK externo a um contrato interno e expõe o token pelo
módulo global correspondente.

## Mapa

- `clerk/`: fornece `AUTHENTICATION_PROVIDER` e seleciona Clerk ou o adaptador
  de desenvolvimento conforme a configuração.
- `r2/`: fornece `STORAGE_PROVIDER` pela implementação compatível com S3.

## Regra

Features consomem `modules/auth/contracts` ou `shared/storage/contracts`,
nunca os clientes Clerk ou S3. Novos provedores mantêm SDK, credenciais e
tratamento específico dentro do adaptador e preservam o contrato público.

## Atenção

Pare e reavalie se a troca de provedor exige mudar uma feature consumidora.
