import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';

describe('resposta de criação concorrente com webhook', () => {
  it('salva identificador sem rebaixar estado terminal nem exigir estado iniciando', async () => {
    const set = jest.fn<unknown, [Record<string, unknown>]>(() => ({
      where: jest.fn(() => ({ returning: () => Promise.resolve([]) })),
    }));
    const repository = new PagamentoRepository({
      update: () => ({ set }),
    } as never);
    await repository.marcarPendente({
      salaoId: 's1',
      cobrancaId: 'c1',
      externalId: 'external',
      instrucaoCliente: null,
    });
    const values = set.mock.calls[0][0] as unknown as { status: unknown };
    expect(values.status).toBeInstanceOf(SQL);
    const query = new PgDialect().sqlToQuery(values.status as SQL);
    expect(query.sql.toLowerCase()).toContain('case when');
    expect(query.sql.toLowerCase()).toContain('else');
  });
});
