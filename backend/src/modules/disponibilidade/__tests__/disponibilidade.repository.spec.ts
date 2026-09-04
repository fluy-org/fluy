jest.mock(
  '@fluy/schema',
  () => ({
    profissional: {
      id: 'profissional.id',
      salao_id: 'profissional.salao_id',
      criado_em: 'profissional.criado_em',
      nome: 'profissional.nome',
      ativo: 'profissional.ativo',
    },
    janelaSemanal: {
      profissional_id: 'janela_semanal.profissional_id',
      dia_semana: 'janela_semanal.dia_semana',
      hora_inicio: 'janela_semanal.hora_inicio',
    },
    janelaOverride: { override_id: 'janela_override.override_id' },
    overrideDisponibilidade: {
      profissional_id: 'override_disponibilidade.profissional_id',
      data: 'override_disponibilidade.data',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  relations: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { and, eq } from 'drizzle-orm';
import { janelaSemanal } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import { DisponibilidadeRepository } from '@/modules/disponibilidade/disponibilidade.repository';

describe('DisponibilidadeRepository', () => {
  const limit = jest.fn();
  const whereBuscar = jest.fn(() => ({ limit }));
  const fromBuscar = jest.fn(() => ({ where: whereBuscar }));
  const select = jest.fn(() => ({ from: fromBuscar }));
  const whereExcluir = jest.fn();
  const excluir = jest.fn(() => ({ where: whereExcluir }));
  const returning = jest.fn();
  const values = jest.fn(() => ({ returning }));
  const inserir = jest.fn(() => ({ values }));
  const transaction = jest.fn();
  const database = {
    select,
    transaction,
  } as unknown as Database;
  const repository = new DisponibilidadeRepository(database);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function esperaComparacao(colunaEsperada: string, valorEsperado: string) {
    const comparacaoEncontrada = (eq as jest.Mock).mock.calls.some(
      ([coluna, valor]) =>
        valor === valorEsperado &&
        (typeof coluna === 'string'
          ? coluna.endsWith(`.${colunaEsperada}`)
          : coluna.name === colunaEsperada),
    );

    expect(comparacaoEncontrada).toBe(true);
  }

  it('busca profissional com id e salão para impedir acesso entre tenants', async () => {
    limit.mockResolvedValue([]);

    await repository.buscarProfissional({
      profissionalId: 'profissional-ana',
      salaoId: 'salao-ana',
    });

    esperaComparacao('id', 'profissional-ana');
    esperaComparacao('salao_id', 'salao-ana');
    expect(and).toHaveBeenCalled();
    expect(whereBuscar).toHaveBeenCalled();
  });

  it('substitui o template dentro de uma transação', async () => {
    returning.mockResolvedValue([]);
    transaction.mockImplementation(async (callback) =>
      callback({ delete: excluir, insert: inserir }),
    );
    const dados = {
      janelas: [
        { dia_semana: 1, hora_inicio: '09:00', hora_fim: '18:00' },
      ],
    };

    await repository.substituirJanelasSemanais({
      profissionalId: 'profissional-ana',
      salaoId: 'salao-ana',
      dados,
    });

    expect(transaction).toHaveBeenCalled();
    esperaComparacao('profissional_id', 'profissional-ana');
    expect(excluir).toHaveBeenCalledWith(janelaSemanal);
    expect(inserir).toHaveBeenCalledWith(janelaSemanal);
    expect(values).toHaveBeenCalledWith([
      {
        profissional_id: 'profissional-ana',
        dia_semana: 1,
        hora_inicio: '09:00',
        hora_fim: '18:00',
      },
    ]);
  });
});
