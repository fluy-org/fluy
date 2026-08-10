# Setup inicial

Guia rápido pra clonar, subir tudo e começar a codar.

## Pré-requisitos

- **Node 20+** ([nodejs.org](https://nodejs.org))
- **Docker Desktop** ([docker.com](https://www.docker.com/products/docker-desktop))
- **git** com acesso ao repo `fluy-org/fluy`

## 1. Clonar e configurar env

```bash
git clone https://github.com/fluy-org/fluy.git
cd fluy
```

Copia o `.env.example` pra `.env` (do jeito que preferir).

Se quiser mudar usuário/senha/porta do banco, edita o `.env` **antes** de subir o Docker. Se mudar, atualiza também a `DATABASE_URL` na mesma linha — ela não é montada automaticamente.

## 2. Instalar dependências

```bash
npm install
```

Sempre **na raiz** do projeto. Nunca dentro de `backend/`, `shared/schema/` ou `frontend/`.

Dura ~3 minutos na primeira vez.

## 3. Buildar o schema

```bash
npm run build:schema
```

Isso compila o pacote `@fluy/schema` (o backend importa dele). Precisa rodar uma vez antes de subir o backend.

## 4. Subir banco e backend

```bash
npm run db:up     # sobe o Postgres via Docker
npm run dev:back  # sobe o Nest em http://localhost:3000
```

Se tudo deu certo, Swagger tá em [http://localhost:3000/docs](http://localhost:3000/docs). 🎉

---

## Dia a dia

Depois do setup, abre 2 a 4 terminais na raiz:

```bash
npm run db:up        # 1x por dia (só se derrubou o Docker)
npm run dev:schema   # opcional: watch pra rebuildar shared/schema ao salvar
npm run dev:back     # backend
npm run dev:front    # frontend (quando existir)
```

Pra parar o banco no fim do dia: `npm run db:down`.

## Adicionar dependência

Sempre da raiz, indicando o workspace:

```bash
npm install <dep> --workspace=backend
npm install <dep> --workspace=frontend
npm install <dep> --workspace=@fluy/schema
```

## Se algo der errado

- **"Cannot find module '@fluy/schema'"** → esqueceu do `npm run build:schema` (ou de `npm install` na raiz).
- **Backend não conecta no banco** → Docker tá rodando? A porta do `.env` bate com a `DATABASE_URL`?
- **Porta ocupada** → outro processo usa a porta. Muda `PORT` ou `POSTGRES_PORT` no `.env`.
- **Mudei schema e backend não vê** → roda `npm run build:schema` de novo, ou deixa `npm run dev:schema` rodando em watch.
