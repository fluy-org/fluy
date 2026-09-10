# Banco de dados

`DatabaseModule` é global e exporta o provider `Database` sob o token
`DATABASE`.

## Uso

```typescript
constructor(@InjectDatabase() private readonly database: Database) {}
```

Use-o em repositories. O provider cria Drizzle para PostgreSQL a partir de
`DATABASE_URL` e do `schema` de `@fluy/schema`; tabelas e tipos de persistência
vêm desse pacote.

## Atenção

Pare e reavalie se controller/service cria `Pool`, instancia Drizzle ou executa
queries diretamente.
