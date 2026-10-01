jest.mock(
  '@fluy/schema',
  () => ({
    agendamento: {
      id: 'agendamento.id',
      salao_id: 'agendamento.salao_id',
      cliente_id: 'agendamento.cliente_id',
    },
    cliente: {
      id: 'cliente.id',
      salao_id: 'cliente.salao_id',
      removido_em: 'cliente.removido_em',
    },
    nota: {
      id: 'nota.id',
      cliente_id: 'nota.cliente_id',
      agendamento_id: 'nota.agendamento_id',
      criada_em: 'nota.criada_em',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  desc: jest.fn(),
  eq: jest.fn(),
  exists: jest.fn(),
  isNull: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq, exists, isNull } from 'drizzle-orm';
import { agendamento, cliente, nota } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import { NotaRepository } from '@/modules/nota/nota.repository';

type Consulta = PromiseLike<unknown[]> & Record<string, unknown>;

function criarConsulta(obterLinhas: () => unknown[]): Consulta {
  const consulta: Consulta = new Proxy({} as Consulta, {
    get(_alvo, propriedade) {
      if (propriedade === 'then') {
        const resultado = Promise.resolve(obterLinhas());

        return resultado.then.bind(resultado) as Promise<unknown[]>['then'];
      }

      return () => consulta;
    },
  });

  return consulta;
}

describe('NotaRepository', () => {
  let linhas: unknown[] = [];
  const consulta = () => criarConsulta(() => linhas);
  const database = {
    select: jest.fn(consulta),
    update: jest.fn(consulta),
    delete: jest.fn(consulta),
  } as unknown as Database;
  const repository = new NotaRepository(database);

  beforeEach(() => {
    jest.clearAllMocks();
    linhas = [];
  });

  describe('listar', () => {
    it('restringe as notas da cliente ao salão pelo join com a cliente', async () => {
      await repository.listar({
        salaoId: 'salao-ana',
        clienteId: 'cliente-ana',
        offset: 0,
        limite: 21,
      });

      expect(eq).toHaveBeenCalledWith(cliente.id, nota.cliente_id);
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(nota.cliente_id, 'cliente-ana');
    });

    it('restringe ao salão também as notas de um agendamento', async () => {
      await repository.listar({
        salaoId: 'salao-ana',
        agendamentoId: 'agendamento-ana',
        offset: 0,
        limite: 21,
      });

      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(nota.agendamento_id, 'agendamento-ana');
    });

    it('devolve a nota achatada', async () => {
      linhas = [{ nota: { id: 'nota-ana' } }];

      await expect(
        repository.listar({ salaoId: 'salao-ana', offset: 0, limite: 21 }),
      ).resolves.toEqual([{ id: 'nota-ana' }]);
    });
  });

  describe('buscarPorId', () => {
    it('busca só no salão e com cliente ativa', async () => {
      await expect(
        repository.buscarPorId({ id: 'nota-ana', salaoId: 'salao-ana' }),
      ).resolves.toBeUndefined();

      expect(eq).toHaveBeenCalledWith(nota.id, 'nota-ana');
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });
  });

  describe.each([
    [
      'atualizar',
      () =>
        repository.atualizar({
          id: 'nota-ana',
          salaoId: 'salao-ana',
          dados: { texto: 'Prefere café sem açúcar.' },
        }),
    ],
    [
      'remover',
      () => repository.remover({ id: 'nota-ana', salaoId: 'salao-ana' }),
    ],
  ])('%s', (_nome, executar) => {
    it('só alcança nota de cliente ativa do salão', async () => {
      await executar();

      expect(exists).toHaveBeenCalledTimes(1);
      expect(eq).toHaveBeenCalledWith(nota.id, 'nota-ana');
      expect(eq).toHaveBeenCalledWith(cliente.id, nota.cliente_id);
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });
  });

  describe('possuiAgendamentoDaCliente', () => {
    it('exige agendamento do salão e da mesma cliente', async () => {
      linhas = [{ id: 'agendamento-ana' }];

      await expect(
        repository.possuiAgendamentoDaCliente({
          agendamentoId: 'agendamento-ana',
          clienteId: 'cliente-ana',
          salaoId: 'salao-ana',
        }),
      ).resolves.toBe(true);
      expect(eq).toHaveBeenCalledWith(agendamento.id, 'agendamento-ana');
      expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, 'cliente-ana');
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-ana');
    });

    it('não encontra agendamento fora do escopo', async () => {
      await expect(
        repository.possuiAgendamentoDaCliente({
          agendamentoId: 'agendamento-bia',
          clienteId: 'cliente-ana',
          salaoId: 'salao-ana',
        }),
      ).resolves.toBe(false);
    });
  });
});
