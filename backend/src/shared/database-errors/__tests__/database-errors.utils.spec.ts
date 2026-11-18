import { DrizzleQueryError } from 'drizzle-orm';
import { ehConflitoUnicidade } from '@/shared/database-errors/database-errors.utils';

describe('ehConflitoUnicidade', () => {
  const constraint = 'cliente_salao_whatsapp_uq';
  const origem = Object.assign(new Error('Duplicidade'), {
    code: '23505',
    constraint,
  });

  it.each([
    origem,
    new DrizzleQueryError('insert', [], origem),
    new Error('Transação', {
      cause: new DrizzleQueryError('insert', [], origem),
    }),
  ])('reconhece a constraint no erro direto ou encapsulado %#', (error) => {
    expect(ehConflitoUnicidade({ error, constraint })).toBe(true);
  });

  it.each([
    null,
    undefined,
    '23505',
    { code: '23505' },
    { code: '23505', constraint: 'outra_constraint' },
    { code: '23503', constraint },
    { code: '23505', cause: { constraint } },
    { cause: { code: '23505', constraint: 'outra_constraint' } },
  ])('não confunde outros erros com a constraint esperada %#', (error) => {
    expect(ehConflitoUnicidade({ error, constraint })).toBe(false);
  });

  it('encerra a busca quando a cadeia de causas tem ciclo', () => {
    const error: { cause?: unknown } = {};
    error.cause = error;
    expect(ehConflitoUnicidade({ error, constraint })).toBe(false);
  });
});
