import { PagamentoRepository } from '../pagamento.repository';
import { cobrancaGateway, webhookGatewayEvento } from '@fluy/schema';

describe('persistência de notificações externas', () => {
  const sets: Array<{ table: unknown; values: Record<string, unknown> }> = [];
  let rows: unknown[][];
  const insert = jest.fn();
  type Chain = {
    from(t: unknown): Chain;
    where(): Chain;
    for(): Chain;
    limit(): Promise<unknown[]>;
    set(values: Record<string, unknown>): Chain;
    returning(): Promise<Array<{ id: string }>>;
    then(resolve: (value: unknown[]) => void): void;
  };
  const chain = (table?: unknown): Chain => ({
    from: (t: unknown) => chain(t),
    where: () => chain(table),
    for: () => chain(table),
    limit: () => Promise.resolve(rows.shift() ?? []),
    set: (values: Record<string, unknown>) => {
      sets.push({ table, values });
      return chain(table);
    },
    returning: () => Promise.resolve([{ id: 'event' }]),
    then: (resolve: (value: unknown[]) => void) => resolve([]),
  });
  const tx = {
    select: () => chain(),
    update: (t: unknown) => chain(t),
    insert,
  };
  const repository = new PagamentoRepository({
    transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as never);
  beforeEach(() => {
    sets.length = 0;
    jest.clearAllMocks();
    const charge = {
      id: 'c1',
      salao_id: 's1',
      agendamento_id: 'a1',
      modalidade: 'sinal',
      status: 'iniciando',
      valor: '25.00',
      total_cliente: '25.00',
      divergencia: false,
      id_externo: null,
      idempotency_key: 'key',
      provedor: 'efi',
    };
    rows = [
      [charge],
      [
        {
          id: 'a1',
          estado: 'reservado',
          expira_em: new Date(Date.now() + 60000),
          valor_sinal: '25.00',
        },
      ],
      [charge],
      [{ id: 'event', status: 'recebido' }],
    ];
    insert.mockImplementation(() => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve([{ id: 'event' }]),
        }),
        then: (resolve: (v: unknown[]) => void) => resolve([]),
      }),
    }));
  });
  it('vincula confirmação anterior à resposta e conclui o mesmo registro do inbox', async () => {
    await repository.aplicarNotificacao({
      salaoId: 's1',
      agora: new Date(),
      notificacao: {
        provider: 'efi',
        eventId: 'e1',
        registroId: 'event',
        reference: 'key',
        externalPaymentId: 'external',
        tipo: 'confirmado',
        ocorridoEm: new Date(),
        valorPagoCentavos: 2500,
      },
    });
    expect(sets).toEqual(
      expect.arrayContaining([
        {
          table: cobrancaGateway,
          values: expect.objectContaining({
            id_externo: 'external',
            status: 'confirmada',
          }) as unknown,
        },
        {
          table: webhookGatewayEvento,
          values: expect.objectContaining({
            status: 'processado',
            salao_id: 's1',
          }) as unknown,
        },
      ]),
    );
    expect(insert).not.toHaveBeenCalledWith(webhookGatewayEvento);
  });
  it('não reaplica registro do inbox já concluído', async () => {
    rows[3] = [{ id: 'event', status: 'processado' }];
    await repository.aplicarNotificacao({
      salaoId: 's1',
      agora: new Date(),
      notificacao: {
        provider: 'efi',
        eventId: 'e1',
        registroId: 'event',
        reference: 'key',
        externalPaymentId: 'external',
        tipo: 'confirmado',
        ocorridoEm: new Date(),
        valorPagoCentavos: 2500,
      },
    });
    expect(sets).toHaveLength(0);
  });
});
