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
      nome: 'cliente.nome',
      whatsapp: 'cliente.whatsapp',
      removido_em: 'cliente.removido_em',
    },
    lembrete: {
      id: 'lembrete.id',
      cliente_id: 'lembrete.cliente_id',
      agendamento_id: 'lembrete.agendamento_id',
      data_alvo: 'lembrete.data_alvo',
      origem: 'lembrete.origem',
      status: 'lembrete.status',
      criado_em: 'lembrete.criado_em',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  eq: jest.fn(),
  exists: jest.fn(),
  gte: jest.fn(),
  isNull: jest.fn(),
  like: jest.fn(),
  lte: jest.fn(),
  or: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq, exists, gte, isNull, lte } from 'drizzle-orm';
import { cliente, lembrete } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import type { ListarLembretePersistenciaInput } from '@/modules/lembrete/contracts';
import { LembreteRepository } from '@/modules/lembrete/lembrete.repository';

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

describe('LembreteRepository', () => {
  let linhas: unknown[] = [];
  const consulta = () => criarConsulta(() => linhas);
  const database = {
    select: jest.fn(consulta),
    update: jest.fn(consulta),
    delete: jest.fn(consulta),
  } as unknown as Database;
  const repository = new LembreteRepository(database);
  const filtros: ListarLembretePersistenciaInput = {
    salaoId: 'salao-ana',
    janela: {},
    offset: 0,
    limite: 21,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    linhas = [];
  });

  describe('listar', () => {
    it('restringe ao salão pelo join com a cliente e só traz ativos', async () => {
      await repository.listar(filtros);

      expect(eq).toHaveBeenCalledWith(cliente.id, lembrete.cliente_id);
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(lembrete.status, 'ativo');
    });

    it('esconde da aba os lembretes de cliente inativa', async () => {
      await repository.listar(filtros);

      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });

    it('mostra lembretes de cliente inativa na ficha dela', async () => {
      await repository.listar({ ...filtros, clienteId: 'cliente-ana' });

      expect(isNull).not.toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(lembrete.cliente_id, 'cliente-ana');
    });

    it('aplica os limites da janela de período', async () => {
      await repository.listar({
        ...filtros,
        janela: { inicio: '2026-06-10', fim: '2026-06-16' },
      });

      expect(gte).toHaveBeenCalledWith(lembrete.data_alvo, '2026-06-10');
      expect(lte).toHaveBeenCalledWith(lembrete.data_alvo, '2026-06-16');
    });

    it('junta a cliente ao lembrete', async () => {
      linhas = [
        {
          lembrete: { id: 'lembrete-ana' },
          cliente: { id: 'cliente-ana', nome: 'Ana' },
        },
      ];

      await expect(repository.listar(filtros)).resolves.toEqual([
        { id: 'lembrete-ana', cliente: { id: 'cliente-ana', nome: 'Ana' } },
      ]);
    });
  });

  describe('buscarPorId', () => {
    it('busca só no salão e com cliente ativa', async () => {
      await expect(
        repository.buscarPorId({ id: 'lembrete-ana', salaoId: 'salao-ana' }),
      ).resolves.toBeUndefined();

      expect(eq).toHaveBeenCalledWith(lembrete.id, 'lembrete-ana');
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });
  });

  describe.each([
    [
      'atualizar',
      () =>
        repository.atualizar({
          id: 'lembrete-ana',
          salaoId: 'salao-ana',
          dados: { texto: 'Ligar para remarcar.' },
        }),
    ],
    [
      'concluir',
      () =>
        repository.concluir({
          id: 'lembrete-ana',
          salaoId: 'salao-ana',
          concluidoEm: new Date('2026-06-10T12:00:00.000Z'),
        }),
    ],
    [
      'remover',
      () => repository.remover({ id: 'lembrete-ana', salaoId: 'salao-ana' }),
    ],
  ])('%s', (_nome, executar) => {
    it('só alcança lembrete de cliente ativa do salão', async () => {
      await executar();

      expect(exists).toHaveBeenCalledTimes(1);
      expect(eq).toHaveBeenCalledWith(lembrete.id, 'lembrete-ana');
      expect(eq).toHaveBeenCalledWith(cliente.id, lembrete.cliente_id);
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });
  });
});
