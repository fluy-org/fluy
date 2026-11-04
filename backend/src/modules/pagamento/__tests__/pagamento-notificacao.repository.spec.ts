import { decidirNotificacao } from '@/modules/pagamento/pagamento-estado-utils';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { chaveIdempotenciaEvento } from '@/modules/pagamento/pagamento-utils';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';
import {
  agendamento,
  cobrancaGateway,
  webhookGatewayEvento,
} from '@fluy/schema';

describe('persistência de notificações externas', () => {
  const sets: Array<{ table: unknown; values: Record<string, unknown> }> = [];
  let rows: unknown[][];
  const filtros: SQL[] = [];
  const bloqueadas: unknown[] = [];
  const insert = jest.fn();
  type Chain = {
    from(t: unknown): Chain;
    where(filtro: SQL): Chain;
    for(): Chain;
    limit(): Promise<unknown[]>;
    set(values: Record<string, unknown>): Chain;
    returning(): Promise<Array<{ id: string }>>;
    then(resolve: (value: unknown[]) => void): void;
  };
  const chain = (table?: unknown): Chain => ({
    from: (t: unknown) => chain(t),
    where: (filtro: SQL) => {
      filtros.push(filtro);
      return chain(table);
    },
    for: () => {
      bloqueadas.push(table);
      return chain(table);
    },
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
    filtros.length = 0;
    bloqueadas.length = 0;
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
      decidir: decidirNotificacao,
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
      decidir: decidirNotificacao,
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
  it('restringe leitura e atualização do inbox à identidade externa e ao salão resolvido', async () => {
    await repository.aplicarNotificacao({
      decidir: decidirNotificacao,
      salaoId: 's1',
      agora: new Date(),
      notificacao: {
        provider: 'efi',
        eventId: 'e1',
        registroId: 'event',
        externalPaymentId: 'external',
        tipo: 'confirmado',
        ocorridoEm: new Date(),
        valorPagoCentavos: 2500,
      },
    });
    const dialect = new PgDialect();
    const identidade = chaveIdempotenciaEvento({
      salaoId: 'efi',
      eventoId: 'e1',
    });
    for (const filtro of [filtros[3], filtros[4]]) {
      const consulta = dialect.sqlToQuery(filtro);
      expect(consulta.sql).toContain('"webhook_gateway_evento"."id_externo" =');
      expect(consulta.sql).toMatch(
        /"salao_id" is null or "webhook_gateway_evento"."salao_id" =/,
      );
      expect(consulta.params).toEqual(['event', identidade, 's1']);
    }
  });
  it('executa a decisão fornecida pelo service após os locks e com o estado atual', async () => {
    rows[2] = [
      { ...(rows[2][0] as Record<string, unknown>), status: 'confirmada' },
    ];
    const decidir = jest.fn(
      (input: Parameters<typeof decidirNotificacao>[0]) => {
        expect(bloqueadas).toEqual([agendamento, cobrancaGateway]);
        expect(sets).toHaveLength(0);
        expect(input.statusCobranca).toBe('confirmada');
        return {
          novoStatus: 'falhou' as const,
          promoverReserva: false,
          divergencia: false,
          alocacoes: [],
        };
      },
    );
    await repository.aplicarNotificacao({
      decidir,
      salaoId: 's1',
      agora: new Date(),
      notificacao: {
        provider: 'efi',
        eventId: 'e1',
        registroId: 'event',
        externalPaymentId: 'external',
        tipo: 'confirmado',
        ocorridoEm: new Date(),
        valorPagoCentavos: 2500,
      },
    });
    expect(decidir).toHaveBeenCalledTimes(1);
    expect(sets).toContainEqual({
      table: cobrancaGateway,
      values: expect.objectContaining({ status: 'falhou' }) as unknown,
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it('não escreve quando a decisão fornecida recusa o valor', async () => {
    const decidir = jest.fn(() => ({ erro: 'valor_divergente' as const }));
    const resultado = await repository.aplicarNotificacao({
      decidir,
      salaoId: 's1',
      agora: new Date(),
      notificacao: {
        provider: 'efi',
        eventId: 'e1',
        registroId: 'event',
        externalPaymentId: 'external',
        tipo: 'confirmado',
        ocorridoEm: new Date(),
        valorPagoCentavos: 2500,
      },
    });
    expect(resultado).toBe('valor_divergente');
    expect(bloqueadas).toEqual([agendamento, cobrancaGateway]);
    expect(sets).toHaveLength(0);
    expect(insert).not.toHaveBeenCalled();
  });
});
