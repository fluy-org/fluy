# CLAUDE.md — Fluy

Regras globais do repositório. Regras específicas de backend vivem em `backend/CLAUDE.md`. Contexto/setup do projeto vive no `README.md` e em `docs/`.

## Docs como fonte de verdade

Antes de codar, consulte `docs/`. Não invente regra de negócio que não esteja lá. Ambiguidade encontrada = atualize o `.md` correspondente no mesmo PR.

## Idioma no código

- Domínio em português. Infra/framework em inglês.
- Não misture PT e EN na mesma palavra composta.

## Pacote @fluy/schema

Só pode ter deps de `drizzle-orm`, `drizzle-zod` e `zod`. Nada de `pg`, `postgres`, `@nestjs/*`.

## Multi-tenant

Toda query filtra por `salao_id`.

## Fuso horário

Datas armazenadas em UTC. Exibição/cálculo no fuso de `salao.fuso_horario` via helper único (backend) e pipe único (frontend).

## Testes

Automatizado só para regra crítica: guard multi-tenant, cálculo de faturamento, geração de slots, fluxo de pagamento. Resto é teste manual seguindo `docs/flows/*.md`.

## Comentários

- Evite por padrão. Código deve ser autoexplicativo.
- Nunca descreva o "o que". Só o "por quê" (regra de negócio não trivial, decisão arquitetural, workaround).
- Permitido separar blocos semânticos em templates grandes (JSX/HTML de forms complexos), sem excesso.

## Mensagens de commit

- Idioma: português.
- Formato: `tipo(escopo): resumo breve`. Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
- Nunca commitar direto. Gere a mensagem, apresente e aguarde aprovação.
- Descreva a mudança pelo efeito no produto, não pela implementação. Nomes de arquivos, funções internas, fixes intermediários não entram.

Exemplo:
```
feat(disponibilidade): adiciona configuração de janela semanal

- cadastra janelas recorrentes por profissional
- suporta overrides por data (fechado ou horários customizados)
```

## Regra final

Se pedirem algo que viole qualquer regra: não execute, avise que viola, sugira a forma correta.
