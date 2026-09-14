jest.mock(
  '@fluy/schema',
  () => ({
    agendamento: {
      id: 'agendamento.id',
      salao_id: 'agendamento.salao_id',
      cliente_id: 'agendamento.cliente_id',
      procedimento_id: 'agendamento.procedimento_id',
      profissional_id: 'agendamento.profissional_id',
      inicio_em: 'agendamento.inicio_em',
      duracao_min: 'agendamento.duracao_min',
      preco_total: 'agendamento.preco_total',
      valor_sinal: 'agendamento.valor_sinal',
      estado: 'agendamento.estado',
    },
    cliente: {
      id: 'cliente.id',
      salao_id: 'cliente.salao_id',
      removido_em: 'cliente.removido_em',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  inArray: jest.fn(),
  isNull: jest.fn(),
  lt: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq } from 'drizzle-orm';
import { agendamento } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import type {
  AgendamentoPersistido,
  CriarAgendamentoComValidacaoInput,
} from '@/modules/agendamento/contracts';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';

describe('AgendamentoRepository', () => {
  const limitarConflitos = jest.fn();
  const filtrarConflitos = jest.fn(() => ({ limit: limitarConflitos }));
  const origemConflitos = jest.fn(() => ({ where: filtrarConflitos }));
  const selecionarConflitos = jest.fn(() => ({ from: origemConflitos }));
  const retornarAgendamentos = jest.fn();
  const definirAgendamentos = jest.fn(() => ({
    returning: retornarAgendamentos,
  }));
  const inserirAgendamentos = jest.fn(() => ({ values: definirAgendamentos }));
  const executar = jest.fn();
  const transacao = jest.fn((callback: (tx: unknown) => unknown) =>
    callback({
      execute: executar,
      select: selecionarConflitos,
      insert: inserirAgendamentos,
    }),
  );
  const database = {
    transaction: transacao,
  } as unknown as Database;
  const repository = new AgendamentoRepository(database);
  const input = criarInput();

  beforeEach(() => {
    jest.clearAllMocks();
    limitarConflitos.mockResolvedValue([]);
  });

  it('não cria quando o conflito é encontrado na transação', async () => {
    limitarConflitos.mockResolvedValue([{ id: 'agendamento-existente' }]);

    await expect(repository.criar(input)).resolves.toBeUndefined();

    expect(transacao).toHaveBeenCalledTimes(1);
    expect(executar).toHaveBeenCalledTimes(1);
    expect(inserirAgendamentos).not.toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith(agendamento.salao_id, input.salaoId);
    expect(eq).toHaveBeenCalledWith(
      agendamento.profissional_id,
      input.profissionalId,
    );
  });

  it('cria depois de adquirir o lock e não encontrar conflito', async () => {
    const agendamentoCriado = {
      id: 'agendamento-criado',
    } as AgendamentoPersistido;
    retornarAgendamentos.mockResolvedValue([agendamentoCriado]);

    await expect(repository.criar(input)).resolves.toBe(agendamentoCriado);

    expect(executar).toHaveBeenCalledTimes(1);
    expect(inserirAgendamentos).toHaveBeenCalledWith(agendamento);
    expect(definirAgendamentos).toHaveBeenCalledWith({
      salao_id: input.salaoId,
      cliente_id: input.clienteId,
      procedimento_id: input.procedimentoId,
      profissional_id: input.profissionalId,
      inicio_em: input.inicioEm,
      duracao_min: input.duracaoMin,
      preco_total: input.precoTotal,
      valor_sinal: input.valorSinal,
      estado: 'agendado',
    });
  });
});

function criarInput(): CriarAgendamentoComValidacaoInput {
  return {
    dataAgendamento: '2026-04-10',
    salaoId: 'salao-ana',
    clienteId: 'cliente-ana',
    procedimentoId: 'procedimento-corte',
    profissionalId: 'profissional-ana',
    inicioEm: new Date('2026-04-10T12:00:00.000Z'),
    duracaoMin: 30,
    precoTotal: '80.00',
    valorSinal: '20.00',
  };
}
