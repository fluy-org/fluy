# Migrações Drizzle

Este diretório guarda SQL gerado pelo Drizzle Kit, além de `meta/` com journal e
snapshots do histórico.

## Fluxo

```bash
# Depois de alterar shared/schema
npm run db:generate
npm run db:migrate
```

As migrações atuais usam prefixo sequencial de quatro dígitos e nome descritivo
em português, como `0002_otimizar_consultas_repositories.sql`.

`scripts/adopt-local-migrations.cjs` serve apenas para adotar histórico de um
banco legado compatível; não é o fluxo comum.

## Atenção

Pare e reavalie se a mudança:

- edita SQL, snapshot ou journal de migração que pode já ter sido aplicada;
- ignora a alteração prévia das tabelas em `shared/schema`;
- usa o script de adoção para um banco novo.
