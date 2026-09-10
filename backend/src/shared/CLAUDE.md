# Infraestrutura compartilhada

`shared/` reúne preocupações transversais sem recurso de domínio HTTP: tenant,
contratos e implementações de storage, provedores externos e filtros.

## Regras

- Modele integrações externas por contrato e token de injeção.
- Features dependem do contrato, não da classe concreta do SDK.
- Providers configuráveis usam `ConfigService<Env, true>`.
- Módulos globais exportam apenas o token público necessário.

`storage/contracts`, por exemplo, define `STORAGE_PROVIDER` e
`StorageProvider`; o módulo R2 conecta a implementação concreta.

## Atenção

Pare e reavalie se uma feature importa cliente de SDK, credencial ou classe de
provedor concreto diretamente.
