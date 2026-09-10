# Configuração

`env.schema.ts` é a fonte única de validação do ambiente.

## Fluxo

1. Adicione a variável ao schema Zod e deixe `Env` inferir seu tipo.
2. Acesse-a por `ConfigService<Env, true>` com
   `config.get('NOME', { infer: true })`.
3. Teste regras entre variáveis em `__tests__/`.

`ConfigModule` é global, carrega `backend/.env` no fonte e no build, usa cache
e falha cedo quando o ambiente é inválido.

## Regras

Transformações de número, booleano e lista pertencem ao schema. Validações que
dependem de mais de uma variável também pertencem ali, como o bypass de
autenticação de desenvolvimento.

## Atenção

Pare e reavalie se algum código fora deste diretório lê `process.env`
diretamente.
