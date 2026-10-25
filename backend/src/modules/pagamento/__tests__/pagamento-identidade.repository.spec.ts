import { drizzle } from 'drizzle-orm/node-postgres';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { cobrancaGateway } from '@fluy/schema';
import { PagamentoRepository } from '../pagamento.repository';

// Compila as queries reais; o cliente controlado não abre conexão.
describe('identidade externa de pagamentos', () => {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const client = { query, release: jest.fn() };
  const database = drizzle({
    client: { ...client, connect: () => Promise.resolve(client) } as never,
  });
  const repository = new PagamentoRepository(database as never);
  const notification = {
    provider: 'other',
    eventId: 'e1',
    externalPaymentId: 'same-id',
    reference: 'local-key',
    tipo: 'confirmado' as const,
    ocorridoEm: new Date(),
    valorPagoCentavos: 2500,
  };
  beforeEach(() => jest.clearAllMocks());

  it('correlaciona por provider antes das alternativas de ID e referência', async () => {
    await repository.buscarCobrancaDoEvento(notification);
    const [statement, params] = query.mock.calls[0] as [
      { text: string },
      unknown[],
    ];
    expect(statement.text).toMatch(/"provedor" = \$1 and \(/);
    expect(params).toEqual(['other', 'same-id', 'local-key', 1]);
  });

  it('aplica o filtro de origem também na entrada financeira direta', async () => {
    await repository.aplicarNotificacao({
      salaoId: 's1',
      notificacao: notification,
      agora: new Date(),
    });
    const call: unknown = query.mock.calls.find(
      ([q]: [{ text?: string } | string]) =>
        typeof q !== 'string' && q.text?.startsWith('select'),
    );
    const [statement, params] = call as [{ text: string }, unknown[]];
    expect(statement.text).toMatch(
      /"salao_id" = \$1 and "cobranca_gateway"\."provedor" = \$2 and \(/,
    );
    expect(params.slice(0, 4)).toEqual(['s1', 'other', 'same-id', 'local-key']);
  });

  it('permite IDs externos iguais em origens diferentes, mantendo unicidade na mesma origem', () => {
    const config = getTableConfig(cobrancaGateway);
    const external = config.columns.find(
      (column) => column.name === 'id_externo',
    )!;
    expect(external.isUnique).toBe(false);
    expect(
      config.uniqueConstraints.some(
        (constraint) =>
          constraint.columns.map((column) => column.name).join(',') ===
          'provedor,id_externo',
      ),
    ).toBe(true);
  });

  it('lista o inbox sem depender do provider ativo', async () => {
    await repository.listarNotificacoesPendentes();
    const [statement, params] = query.mock.calls[0] as [
      { text: string },
      unknown[],
    ];
    expect(statement.text).not.toContain("->>'provider'");
    expect(params).toEqual(['recebido', 'falhou', 20]);
  });
});
