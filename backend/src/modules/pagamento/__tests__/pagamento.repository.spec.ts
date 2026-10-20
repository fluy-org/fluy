jest.mock('@fluy/schema', () => ({
  ACAO_AGENDAMENTO: [],
  agendamento: {
    id: 'agendamento.id',
    salao_id: 'agendamento.salao_id',
    cliente_id: 'agendamento.cliente_id',
    expira_em: 'agendamento.expira_em',
    estado: 'agendamento.estado',
  },
  cobrancaGateway: {
    id: 'cobranca_gateway.id',
    agendamento_id: 'cobranca_gateway.agendamento_id',
    salao_id: 'cobranca_gateway.salao_id',
    status: 'cobranca_gateway.status',
    criada_em: 'cobranca_gateway.criada_em',
  },
}));

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  desc: jest.fn(),
  inArray: jest.fn(),
  lt: jest.fn(),
  lte: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));
jest.mock('@/modules/agendamento/agendamento-utils', () => ({
  emCentavos: jest.fn(),
  formatarCentavos: jest.fn(),
}));

import { eq } from 'drizzle-orm';
import { agendamento } from '@fluy/schema';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';

describe('PagamentoRepository', () => {
  const limit = jest.fn();
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  const select = jest.fn(() => ({ from }));
  const repository = new PagamentoRepository({ select } as never);

  beforeEach(() => jest.clearAllMocks());

  it('busca a reserva somente no salão e cliente autenticados', async () => {
    limit.mockResolvedValue([{ id: 'reserva-1' }]);

    await repository.buscarReserva({
      id: 'reserva-1',
      salaoId: 'salao-a',
      clienteId: 'cliente-a',
    });

    expect(eq).toHaveBeenCalledWith(agendamento.id, 'reserva-1');
    expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-a');
    expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, 'cliente-a');
  });

  it('consulta cobrança vinculada à reserva da cliente e do salão', async () => {
    const orderBy = jest.fn(() => ({ limit }));
    const whereConsulta = jest.fn(() => ({ orderBy }));
    const innerJoin = jest.fn(() => ({ where: whereConsulta }));
    from.mockReturnValueOnce({ innerJoin } as never);
    limit.mockResolvedValueOnce([{ id: 'cobranca-a' }]);

    await repository.buscarPagamento({
      salaoId: 'salao-a',
      clienteId: 'cliente-a',
      agendamentoId: 'reserva-a',
    });

    expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-a');
    expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, 'cliente-a');
    expect(eq).toHaveBeenCalledWith(agendamento.id, 'reserva-a');
  });
});
