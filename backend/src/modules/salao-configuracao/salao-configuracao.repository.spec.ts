jest.mock(
  '@fluy/schema',
  () => ({
    configuracaoSalao: { salao_id: 'salao_id' },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

import { eq } from 'drizzle-orm';
import { configuracaoSalao } from '@fluy/schema';
import type { Database } from '../../database/database.provider';
import { SalaoConfiguracaoRepository } from './salao-configuracao.repository';

describe('SalaoConfiguracaoRepository', () => {
  const limit = jest.fn();
  const whereBuscar = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where: whereBuscar }));
  const select = jest.fn(() => ({ from }));
  const returning = jest.fn();
  const whereAtualizar = jest.fn(() => ({ returning }));
  const set = jest.fn((_dados: unknown) => {
    void _dados;
    return { where: whereAtualizar };
  });
  const update = jest.fn(() => ({ set }));
  const database = {
    select,
    update,
  } as unknown as Database;
  const repository = new SalaoConfiguracaoRepository(database);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filtra a busca pelo salão informado', async () => {
    limit.mockResolvedValue([]);

    await repository.buscarPorSalaoId('salao-ana');

    expect(eq).toHaveBeenCalledWith(configuracaoSalao.salao_id, 'salao-ana');
    expect(whereBuscar).toHaveBeenCalled();
  });

  it('filtra a atualização pelo salão informado', async () => {
    returning.mockResolvedValue([]);
    const dados = { tolerancia_atraso_min: 20 };

    await repository.atualizar({ dados, salaoId: 'salao-ana' });

    expect(set).toHaveBeenCalledWith(dados);
    expect(eq).toHaveBeenCalledWith(configuracaoSalao.salao_id, 'salao-ana');
    expect(whereAtualizar).toHaveBeenCalled();
  });
});
