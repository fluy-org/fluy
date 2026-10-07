jest.mock(
  '@fluy/schema',
  () => ({
    agendamento: {
      id: 'agendamento.id',
      salao_id: 'agendamento.salao_id',
      cliente_id: 'agendamento.cliente_id',
      procedimento_id: 'agendamento.procedimento_id',
      preco_total: 'agendamento.preco_total',
    },
    cliente: { id: 'cliente.id', nome: 'cliente.nome' },
    procedimento: { id: 'procedimento.id', nome: 'procedimento.nome' },
    eventoAgendamento: {
      agendamento_id: 'evento_agendamento.agendamento_id',
      tipo: 'evento_agendamento.tipo',
      ocorreu_em: 'evento_agendamento.ocorreu_em',
      cancelado_por: 'evento_agendamento.cancelado_por',
    },
    pagamentoAgendamento: {
      agendamento_id: 'pagamento_agendamento.agendamento_id',
      tipo: 'pagamento_agendamento.tipo',
      cobranca_manual_id: 'pagamento_agendamento.cobranca_manual_id',
      cobranca_gateway_id: 'pagamento_agendamento.cobranca_gateway_id',
    },
    cobrancaManual: {
      id: 'cobranca_manual.id',
      metodo: 'cobranca_manual.metodo',
    },
    cobrancaGateway: {
      id: 'cobranca_gateway.id',
      metodo: 'cobranca_gateway.metodo',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  desc: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  inArray: jest.fn(),
  lt: jest.fn(),
  sql: jest.fn(() => ({ mapWith: () => 'campo-calculado' })),
}));

jest.mock('@/shared/recebimento/recebimento.utils', () => ({
  montarValorRecebido: jest.fn(() => 'valor-recebido'),
  montarFiltroEstadosComRecebimento: jest.fn(() => 'estados-com-recebimento'),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq, gte, inArray, lt } from 'drizzle-orm';
import {
  agendamento,
  eventoAgendamento,
  pagamentoAgendamento,
} from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import { montarFiltroEstadosComRecebimento } from '@/shared/recebimento/recebimento.utils';
import { FaturamentoRepository } from '@/modules/faturamento/faturamento.repository';

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

describe('FaturamentoRepository', () => {
  const INICIO = new Date('2026-09-01T03:00:00.000Z');
  const FIM = new Date('2026-10-01T03:00:00.000Z');
  const encerramento = {
    agendamento_id: 'agendamento-ana',
    tipo: 'concluido',
    ocorreu_em: new Date('2026-09-10T15:00:00.000Z'),
    cancelado_por: null,
    preco_total_centavos: 10000,
    cliente: { id: 'cliente-ana', nome: 'Ana' },
    procedimento: { id: 'procedimento-corte', nome: 'Corte' },
  };
  let respostas: unknown[][] = [];
  const selecionar = jest.fn(() => {
    const linhas = respostas.shift() ?? [];

    return criarConsulta(() => linhas);
  });
  const database = { select: selecionar } as unknown as Database;
  const repository = new FaturamentoRepository(database);

  beforeEach(() => {
    jest.clearAllMocks();
    respostas = [];
  });

  describe('listarEncerramentosDoPeriodo', () => {
    it('restringe ao salão, ao período e aos encerramentos', async () => {
      await repository.listarEncerramentosDoPeriodo({
        salaoId: 'salao-ana',
        inicio: INICIO,
        fim: FIM,
      });

      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-ana');
      expect(inArray).toHaveBeenCalledWith(eventoAgendamento.tipo, [
        'concluido',
        'cancelado',
        'falta',
      ]);
      expect(gte).toHaveBeenCalledWith(eventoAgendamento.ocorreu_em, INICIO);
      expect(lt).toHaveBeenCalledWith(eventoAgendamento.ocorreu_em, FIM);
      expect(montarFiltroEstadosComRecebimento).toHaveBeenCalled();
    });

    it('não consulta pagamentos quando o período não tem encerramentos', async () => {
      await expect(
        repository.listarEncerramentosDoPeriodo({
          salaoId: 'salao-ana',
          inicio: INICIO,
          fim: FIM,
        }),
      ).resolves.toEqual([]);

      expect(selecionar).toHaveBeenCalledTimes(1);
    });

    it('anexa a cada encerramento os pagamentos dele, também filtrados pelo salão', async () => {
      respostas = [
        [encerramento, { ...encerramento, agendamento_id: 'agendamento-bia' }],
        [
          {
            agendamento_id: 'agendamento-ana',
            tipo: 'restante',
            origem: 'manual',
            metodo: 'dinheiro',
            valor_centavos: 10000,
          },
        ],
      ];

      const resultado = await repository.listarEncerramentosDoPeriodo({
        salaoId: 'salao-ana',
        inicio: INICIO,
        fim: FIM,
      });

      expect(inArray).toHaveBeenCalledWith(
        pagamentoAgendamento.agendamento_id,
        ['agendamento-ana', 'agendamento-bia'],
      );
      expect(
        jest
          .mocked(eq)
          .mock.calls.filter(([coluna]) => coluna === agendamento.salao_id),
      ).toHaveLength(2);
      expect(resultado).toEqual([
        {
          ...encerramento,
          pagamentos: [
            {
              tipo: 'restante',
              origem: 'manual',
              metodo: 'dinheiro',
              valor_centavos: 10000,
            },
          ],
        },
        { ...encerramento, agendamento_id: 'agendamento-bia', pagamentos: [] },
      ]);
    });
  });

  describe('listarAtendimentosDoPeriodo', () => {
    it('lista só concluídos do salão no período', async () => {
      await repository.listarAtendimentosDoPeriodo({
        salaoId: 'salao-ana',
        inicio: INICIO,
        fim: FIM,
        offset: 20,
        limite: 21,
      });

      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, 'salao-ana');
      expect(inArray).toHaveBeenCalledWith(eventoAgendamento.tipo, [
        'concluido',
      ]);
    });
  });
});
