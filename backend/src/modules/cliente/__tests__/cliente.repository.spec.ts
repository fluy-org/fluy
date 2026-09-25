jest.mock(
  '@fluy/schema',
  () => ({
    agendamento: {
      id: 'agendamento.id',
      salao_id: 'agendamento.salao_id',
      cliente_id: 'agendamento.cliente_id',
      procedimento_id: 'agendamento.procedimento_id',
      inicio_em: 'agendamento.inicio_em',
      preco_total: 'agendamento.preco_total',
      estado: 'agendamento.estado',
    },
    cliente: {
      id: 'cliente.id',
      salao_id: 'cliente.salao_id',
      nome: 'cliente.nome',
      whatsapp: 'cliente.whatsapp',
      criada_em: 'cliente.criada_em',
      removido_em: 'cliente.removido_em',
    },
    procedimento: {
      id: 'procedimento.id',
      nome: 'procedimento.nome',
    },
    pagamentoAgendamento: {
      agendamento_id: 'pagamento_agendamento.agendamento_id',
      cobranca_manual_id: 'pagamento_agendamento.cobranca_manual_id',
      cobranca_gateway_id: 'pagamento_agendamento.cobranca_gateway_id',
    },
    cobrancaManual: {
      id: 'cobranca_manual.id',
      valor: 'cobranca_manual.valor',
    },
    cobrancaGateway: {
      id: 'cobranca_gateway.id',
      valor: 'cobranca_gateway.valor',
      status: 'cobranca_gateway.status',
    },
    reembolso: {
      valor: 'reembolso.valor',
      confirmado_em: 'reembolso.confirmado_em',
      cobranca_manual_id: 'reembolso.cobranca_manual_id',
      cobranca_gateway_id: 'reembolso.cobranca_gateway_id',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  desc: jest.fn(),
  eq: jest.fn(),
  exists: jest.fn(),
  gte: jest.fn(),
  isNotNull: jest.fn(),
  isNull: jest.fn(),
  like: jest.fn(),
  lte: jest.fn(),
  or: jest.fn(),
  sql: jest.fn(() => ({
    mapWith: () => ({ as: () => 'campo-agregado' }),
    as: () => 'campo-agregado',
  })),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq, exists, isNull } from 'drizzle-orm';
import { agendamento, cliente } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import type { ListarClientePersistenciaInput } from '@/modules/cliente/contracts';

type Consulta = PromiseLike<unknown[]> & Record<string, unknown>;

function criarConsulta(obterLinhas: () => unknown[]): Consulta {
  const consulta: Consulta = new Proxy({} as Consulta, {
    get(_alvo, propriedade) {
      if (propriedade === 'then') {
        const resultado = Promise.resolve(obterLinhas());

        return resultado.then.bind(resultado) as Promise<unknown[]>['then'];
      }

      if (propriedade === 'as') {
        return (alias: string) =>
          new Proxy(
            {},
            { get: (_subquery, campo) => `${alias}.${String(campo)}` },
          );
      }

      return () => consulta;
    },
  });

  return consulta;
}

describe('ClienteRepository', () => {
  let linhas: unknown[] = [];
  const selecionar = jest.fn(() => criarConsulta(() => linhas));
  const database = { select: selecionar } as unknown as Database;
  const repository = new ClienteRepository(database);
  const agora = new Date('2026-09-24T12:00:00.000Z');
  const filtros: ListarClientePersistenciaInput = {
    salaoId: 'salao-ana',
    status: 'ativos',
    segmento: 'todas',
    ordenacao: 'nome',
    agora,
    janelaRecenteDesde: new Date('2026-08-25T12:00:00.000Z'),
    offset: 0,
    limite: 21,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    linhas = [];
  });

  describe('listar', () => {
    it('restringe clientes e agregados ao salão informado', async () => {
      await repository.listar(filtros);

      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-ana');
      expect(
        jest
          .mocked(eq)
          .mock.calls.filter(([coluna]) => coluna === agendamento.salao_id),
      ).toHaveLength(2);
    });

    it('restringe ao salão também o segmento de atendidas recentes', async () => {
      await repository.listar({ ...filtros, segmento: 'atendidas_30_dias' });

      expect(exists).toHaveBeenCalledTimes(1);
      expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, cliente.id);
      expect(
        jest
          .mocked(eq)
          .mock.calls.filter(([coluna]) => coluna === agendamento.salao_id),
      ).toHaveLength(3);
    });

    it('filtra só clientes ativos por padrão', async () => {
      await repository.listar(filtros);

      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });

    it('achata o cliente com o último atendimento', async () => {
      const ultimoAtendimento = new Date('2026-09-10T15:00:00.000Z');
      linhas = [
        {
          cliente: { id: 'cliente-ana', nome: 'Ana' },
          ultimo_atendimento_em: ultimoAtendimento,
        },
      ];

      await expect(repository.listar(filtros)).resolves.toEqual([
        {
          id: 'cliente-ana',
          nome: 'Ana',
          ultimo_atendimento_em: ultimoAtendimento,
        },
      ]);
    });
  });

  describe('buscarFicha', () => {
    it('restringe a ficha e os agregados ao salão e ao cliente', async () => {
      await repository.buscarFicha({ id: 'cliente-ana', salaoId: 'salao-ana' });

      expect(eq).toHaveBeenCalledWith(cliente.id, 'cliente-ana');
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, 'cliente-ana');
      expect(
        jest
          .mocked(eq)
          .mock.calls.filter(([coluna]) => coluna === agendamento.salao_id),
      ).toHaveLength(2);
    });

    it('não filtra por cliente ativo', async () => {
      await repository.buscarFicha({ id: 'cliente-ana', salaoId: 'salao-ana' });

      expect(isNull).not.toHaveBeenCalled();
    });

    it('devolve undefined quando o cliente não está no salão', async () => {
      await expect(
        repository.buscarFicha({ id: 'cliente-bia', salaoId: 'salao-ana' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('possuiCliente', () => {
    it('verifica o cliente no salão informado', async () => {
      linhas = [{ id: 'cliente-ana' }];

      await expect(
        repository.possuiCliente({ id: 'cliente-ana', salaoId: 'salao-ana' }),
      ).resolves.toBe(true);
      expect(eq).toHaveBeenCalledWith(cliente.id, 'cliente-ana');
      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
    });
  });

  describe('listarAgendamentos', () => {
    it('restringe o histórico ao cliente e ao salão informados', async () => {
      await repository.listarAgendamentos({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
        offset: 0,
        limite: 21,
      });

      expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, 'cliente-ana');
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-ana');
    });
  });

  describe('buscarPorId', () => {
    it('continua buscando só cliente ativo no salão', async () => {
      await repository.buscarPorId({ id: 'cliente-ana', salaoId: 'salao-ana' });

      expect(eq).toHaveBeenCalledWith(cliente.salao_id, 'salao-ana');
      expect(isNull).toHaveBeenCalledWith(cliente.removido_em);
    });
  });
});
