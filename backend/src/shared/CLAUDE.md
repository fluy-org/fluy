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

## Resposta de erro

`filters/all-exceptions.filter.ts` é global e é o **único** lugar que monta o
corpo de erro da API. O formato é fixo:

```
{ statusCode, error, messages[], codigo?, sugestoes?, requestId? }
```

`messages` é sempre array — inclusive para uma mensagem só. Erro de validação
Zod vira uma entrada por issue, no formato `campo.aninhado: mensagem`.

Features não montam resposta de erro: lançam a exceção Nest e o filtro
converte. Para um erro que o frontend precise tratar de forma programática,
passe `codigo` e, quando fizer sentido, `sugestoes` no corpo da exceção — é o
que `salao-onboarding` faz com `subdominio_indisponivel`.

Só falha 5xx é logada com stack; 4xx é esperada e o `pino-http` já registra.

## Atenção

Pare e reavalie se:

- uma feature importa cliente de SDK, credencial ou classe de provedor concreto
  diretamente;
- algum código monta corpo de erro próprio ou um segundo filtro de exceção.
