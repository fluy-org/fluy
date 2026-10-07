# Unificar a resolução do cursor de paginação

## Problema

O mesmo método privado `resolverOffset` está copiado em cinco services:

- `backend/src/modules/cliente/cliente.service.ts`
- `backend/src/modules/nota/nota.service.ts`
- `backend/src/modules/lembrete/lembrete.service.ts`
- `backend/src/modules/aviso/aviso.service.ts`
- `backend/src/modules/faturamento/faturamento.service.ts`

Todos fazem a mesma coisa: sem cursor, o offset é `0`; com cursor, o service
chama `decodificarCursorPagina` e, se o resultado for `undefined`, lança
`BadRequestException('Cursor de paginação inválido.')`.

`shared/paginacao/paginacao.utils.ts` só decodifica o cursor; a regra de
"ausente vira 0" e o erro ficaram repetidos em cada feature.

## Restrição

`backend/src/modules/CLAUDE.md` define que cursor inválido é
`BadRequestException` **no service** e que só service e validator lançam
exceção. O helper compartilhado não pode lançar exceção Nest.

## Proposta

- Acrescentar a `paginacao.utils.ts` uma função que resolve o offset a partir do
  cursor opcional: devolve `0` sem cursor, o offset com cursor válido e
  `undefined` com cursor inválido. Cobrir no `paginacao.utils.spec.ts`.
- Nos cinco services, trocar o `resolverOffset` privado pela função
  compartilhada, mantendo no service apenas o
  `throw new BadRequestException('Cursor de paginação inválido.')`.
- Atualizar a seção "Paginação" de `backend/src/modules/CLAUDE.md` citando a
  função.

## Critério de conclusão

Nenhum service com `resolverOffset` próprio; specs de paginação dos cinco
services continuam verdes (`npm test` no backend).
