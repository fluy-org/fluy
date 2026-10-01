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
      nome: 'cliente.nome',
      whatsapp: 'cliente.whatsapp',
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
      metodo: 'cobranca_manual.metodo',
      registrada_por: 'cobranca_manual.registrada_por',
    },
    eventoAgendamento: {
      id: 'evento_agendamento.id',
      agendamento_id: 'evento_agendamento.agendamento_id',
      tipo: 'evento_agendamento.tipo',
      ocorreu_em: 'evento_agendamento.ocorreu_em',
    },
    cobrancaGateway: {
      id: 'cobranca_gateway.id',
      valor: 'cobranca_gateway.valor',
      status: 'cobranca_gateway.status',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  inArray: jest.fn(),
  isNull: jest.fn(),
  lt: jest.fn(),
  ne: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { eq, gte, inArray, lt, ne } from 'drizzle-orm';
import {
  agendamento,
  cobrancaManual,
  eventoAgendamento,
  pagamentoAgendamento,
} from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import type {
  AgendamentoPersistido,
  CriarAgendamentoComValidacaoInput,
} from '@/modules/agendamento/contracts';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';

type EncadeamentoAgenda = {
  innerJoin: jest.Mock<EncadeamentoAgenda, []>;
  leftJoin: jest.Mock<EncadeamentoAgenda, []>;
  where: jest.Mock;
};

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
  const retornarConclusao = jest.fn();
  const filtrarConclusao = jest.fn(() => ({ returning: retornarConclusao }));
  const definirConclusao = jest.fn(() => ({ where: filtrarConclusao }));
  const atualizarAgendamentos = jest.fn(() => ({ set: definirConclusao }));
  const executar = jest.fn();
  const transacao = jest.fn((callback: (tx: unknown) => unknown) =>
    callback({
      execute: executar,
      select: selecionarConflitos,
      insert: inserirAgendamentos,
      update: atualizarAgendamentos,
    }),
  );
  const ordenarAgenda = jest.fn();
  let linhasDaAgenda: unknown[] = [];
  const filtrarAgenda = jest.fn(() => {
    const resultado = Promise.resolve(linhasDaAgenda) as Promise<unknown[]> & {
      orderBy: jest.Mock;
    };
    resultado.orderBy = ordenarAgenda;

    return resultado;
  });
  const encadearAgenda: EncadeamentoAgenda = {
    innerJoin: jest.fn(() => encadearAgenda),
    leftJoin: jest.fn(() => encadearAgenda),
    where: filtrarAgenda,
  };
  let remarcacoes: unknown[] = [];
  const filtrarRemarcacoes = jest.fn(() => Promise.resolve(remarcacoes));
  const origemAgenda = jest.fn((tabela: unknown) =>
    tabela === eventoAgendamento
      ? ({ where: filtrarRemarcacoes } as unknown as EncadeamentoAgenda)
      : encadearAgenda,
  );
  const selecionarAgenda = jest.fn(() => ({ from: origemAgenda }));
  const database = {
    transaction: transacao,
    select: selecionarAgenda,
  } as unknown as Database;
  const repository = new AgendamentoRepository(database);
  const input = criarInput();

  beforeEach(() => {
    jest.clearAllMocks();
    limitarConflitos.mockResolvedValue([]);
    linhasDaAgenda = [];
    remarcacoes = [];
    ordenarAgenda.mockImplementation(() => Promise.resolve(linhasDaAgenda));
  });

  it('não cria quando o conflito é encontrado na transação', async () => {
    limitarConflitos
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'agendamento-existente' }]);

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

  it('não cria o mesmo procedimento duas vezes para a cliente no dia', async () => {
    limitarConflitos.mockResolvedValueOnce([
      { id: 'agendamento-duplicado' },
    ]);

    await expect(repository.criar(input)).resolves.toBeUndefined();

    expect(transacao).toHaveBeenCalledTimes(1);
    expect(executar).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith(agendamento.cliente_id, input.clienteId);
    expect(eq).toHaveBeenCalledWith(
      agendamento.procedimento_id,
      input.procedimentoId,
    );
    expect(inserirAgendamentos).not.toHaveBeenCalled();
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

  describe('concluir', () => {
    const OCORREU_EM = new Date('2026-09-15T18:30:00.000Z');
    const entrada = {
      id: 'agendamento-ana',
      salaoId: 'salao-ana',
      ocorreuEm: OCORREU_EM,
      cobranca: undefined,
    };
    const agendamentoConcluido = {
      id: 'agendamento-ana',
      estado: 'concluido',
    } as AgendamentoPersistido;

    it('restringe a conclusão ao salão e ao estado agendado', async () => {
      retornarConclusao.mockResolvedValue([agendamentoConcluido]);

      await repository.concluir(entrada);

      expect(definirConclusao).toHaveBeenCalledWith({ estado: 'concluido' });
      expect(eq).toHaveBeenCalledWith(agendamento.id, entrada.id);
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
      expect(eq).toHaveBeenCalledWith(agendamento.estado, 'agendado');
    });

    it('não grava evento nem cobrança quando a corrida é perdida', async () => {
      retornarConclusao.mockResolvedValue([]);

      await expect(repository.concluir(entrada)).resolves.toBeUndefined();

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).not.toHaveBeenCalled();
    });

    it('grava apenas o evento quando não houve pagamento', async () => {
      retornarConclusao.mockResolvedValue([agendamentoConcluido]);

      await expect(repository.concluir(entrada)).resolves.toBe(
        agendamentoConcluido,
      );

      expect(inserirAgendamentos).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).toHaveBeenCalledWith(eventoAgendamento);
      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoConcluido.id,
        tipo: 'concluido',
        ocorreu_em: OCORREU_EM,
      });
    });

    it('grava evento, cobrança manual e vínculo na mesma transação', async () => {
      retornarConclusao.mockResolvedValue([agendamentoConcluido]);
      retornarAgendamentos.mockResolvedValue([{ id: 'cobranca-ana' }]);

      await repository.concluir({
        ...entrada,
        cobranca: {
          valor: '120.00',
          metodo: 'dinheiro',
          registradaPor: 'usuario-salao-ana',
        },
      });

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).toHaveBeenNthCalledWith(1, eventoAgendamento);
      expect(inserirAgendamentos).toHaveBeenNthCalledWith(2, cobrancaManual);
      expect(inserirAgendamentos).toHaveBeenNthCalledWith(
        3,
        pagamentoAgendamento,
      );
      expect(definirAgendamentos).toHaveBeenCalledWith({
        valor: '120.00',
        metodo: 'dinheiro',
        registrada_por: 'usuario-salao-ana',
      });
      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoConcluido.id,
        cobranca_manual_id: 'cobranca-ana',
      });
    });
  });

  describe('marcarFalta', () => {
    const OCORREU_EM = new Date('2026-09-15T14:10:00.000Z');
    const entrada = {
      id: 'agendamento-ana',
      salaoId: 'salao-ana',
      ocorreuEm: OCORREU_EM,
    };
    const agendamentoMarcado = {
      id: 'agendamento-ana',
      estado: 'falta',
    } as AgendamentoPersistido;

    it('restringe a marcação ao salão e ao estado agendado', async () => {
      retornarConclusao.mockResolvedValue([agendamentoMarcado]);

      await repository.marcarFalta(entrada);

      expect(definirConclusao).toHaveBeenCalledWith({ estado: 'falta' });
      expect(eq).toHaveBeenCalledWith(agendamento.id, entrada.id);
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
      expect(eq).toHaveBeenCalledWith(agendamento.estado, 'agendado');
    });

    it('não grava evento quando a corrida é perdida', async () => {
      retornarConclusao.mockResolvedValue([]);

      await expect(repository.marcarFalta(entrada)).resolves.toBeUndefined();

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).not.toHaveBeenCalled();
    });

    it('grava o evento de falta na mesma transação', async () => {
      retornarConclusao.mockResolvedValue([agendamentoMarcado]);

      await expect(repository.marcarFalta(entrada)).resolves.toBe(
        agendamentoMarcado,
      );

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).toHaveBeenCalledWith(eventoAgendamento);
      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoMarcado.id,
        tipo: 'falta',
        ocorreu_em: OCORREU_EM,
      });
    });
  });

  describe('cancelar', () => {
    const OCORREU_EM = new Date('2026-09-15T14:10:00.000Z');
    const entrada = {
      id: 'agendamento-ana',
      salaoId: 'salao-ana',
      ocorreuEm: OCORREU_EM,
      motivo: undefined,
    };
    const agendamentoCancelado = {
      id: 'agendamento-ana',
      estado: 'cancelado',
    } as AgendamentoPersistido;

    it('restringe o cancelamento ao salão e aos estados ainda ocupando o slot', async () => {
      retornarConclusao.mockResolvedValue([agendamentoCancelado]);

      await repository.cancelar(entrada);

      expect(definirConclusao).toHaveBeenCalledWith({ estado: 'cancelado' });
      expect(eq).toHaveBeenCalledWith(agendamento.id, entrada.id);
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
      expect(inArray).toHaveBeenCalledWith(agendamento.estado, [
        'agendado',
        'reservado',
      ]);
    });

    it('não grava evento quando a corrida é perdida', async () => {
      retornarConclusao.mockResolvedValue([]);

      await expect(repository.cancelar(entrada)).resolves.toBeUndefined();

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).not.toHaveBeenCalled();
    });

    it('grava o motivo junto do evento de cancelamento', async () => {
      retornarConclusao.mockResolvedValue([agendamentoCancelado]);

      await repository.cancelar({ ...entrada, motivo: 'Profissional doente' });

      expect(inserirAgendamentos).toHaveBeenCalledWith(eventoAgendamento);
      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoCancelado.id,
        tipo: 'cancelado',
        ocorreu_em: OCORREU_EM,
        motivo: 'Profissional doente',
      });
    });

    it('grava o evento sem motivo quando ele não foi informado', async () => {
      retornarConclusao.mockResolvedValue([agendamentoCancelado]);

      await repository.cancelar(entrada);

      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoCancelado.id,
        tipo: 'cancelado',
        ocorreu_em: OCORREU_EM,
        motivo: undefined,
      });
    });
  });

  describe('listarDoDia', () => {
    const entrada = {
      salaoId: 'salao-ana',
      data: '2026-09-15',
      fusoHorario: 'America/Sao_Paulo',
    };

    it('filtra pelo salão da requisição', async () => {
      await repository.listarDoDia(entrada);

      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
    });

    it('deriva a faixa UTC do dia a partir do fuso do salão', async () => {
      await repository.listarDoDia(entrada);

      expect(gte).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-09-15T03:00:00.000Z'),
      );
      expect(lt).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-09-16T03:00:00.000Z'),
      );
    });

    it('não filtra por estado: a agenda mostra o dia inteiro', async () => {
      linhasDaAgenda = [
        linhaDaAgenda({ id: 'agendamento-concluido', estado: 'concluido' }),
        linhaDaAgenda({ id: 'agendamento-cancelado', estado: 'cancelado' }),
      ];

      const agendamentos = await repository.listarDoDia(entrada);

      expect(agendamentos.map(({ estado }) => estado)).toEqual([
        'concluido',
        'cancelado',
      ]);
    });

    it('agrupa os pagamentos do mesmo agendamento em um registro só', async () => {
      linhasDaAgenda = [
        linhaDaAgenda({ id: 'agendamento-ana', valor_manual: '50.00' }),
        linhaDaAgenda({
          id: 'agendamento-ana',
          valor_gateway: '30.00',
          status_gateway: 'confirmada',
        }),
      ];

      const agendamentos = await repository.listarDoDia(entrada);

      expect(agendamentos).toHaveLength(1);
      expect(agendamentos[0].pagamentos).toEqual([
        { valor: '50.00', status: null },
        { valor: '30.00', status: 'confirmada' },
      ]);
    });

    it('devolve lista de pagamentos vazia quando não há cobrança vinculada', async () => {
      linhasDaAgenda = [linhaDaAgenda({ id: 'agendamento-ana' })];

      const agendamentos = await repository.listarDoDia(entrada);

      expect(agendamentos[0].pagamentos).toEqual([]);
    });
  });

  describe('buscarDetalhe', () => {
    const entrada = { id: 'agendamento-ana', salaoId: 'salao-ana' };

    it('filtra pelo identificador e pelo salão da requisição', async () => {
      await repository.buscarDetalhe(entrada);

      expect(eq).toHaveBeenCalledWith(agendamento.id, entrada.id);
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
    });

    it('devolve undefined quando o agendamento não está no escopo do salão', async () => {
      await expect(repository.buscarDetalhe(entrada)).resolves.toBeUndefined();
    });

    it('devolve o agendamento com cliente e procedimento', async () => {
      linhasDaAgenda = [linhaDaAgenda({ id: entrada.id })];

      const encontrado = await repository.buscarDetalhe(entrada);

      expect(encontrado?.id).toBe(entrada.id);
      expect(encontrado?.cliente).toEqual({
        id: 'cliente-ana',
        nome: 'Ana Paula',
        whatsapp: '+5511999999999',
      });
      expect(encontrado?.procedimento).toEqual({
        id: 'procedimento-corte',
        nome: 'Corte',
      });
    });

    it('conta os eventos de remarcação do agendamento', async () => {
      linhasDaAgenda = [linhaDaAgenda({ id: entrada.id })];
      remarcacoes = [{ id: 'evento-um' }, { id: 'evento-dois' }];

      const encontrado = await repository.buscarDetalhe(entrada);

      expect(encontrado?.remarcado_vezes).toBe(2);
      expect(eq).toHaveBeenCalledWith(
        eventoAgendamento.agendamento_id,
        entrada.id,
      );
      expect(eq).toHaveBeenCalledWith(eventoAgendamento.tipo, 'remarcado');
    });

    it('não conta remarcação quando o agendamento nunca foi movido', async () => {
      linhasDaAgenda = [linhaDaAgenda({ id: entrada.id })];

      await expect(repository.buscarDetalhe(entrada)).resolves.toMatchObject({
        remarcado_vezes: 0,
      });
    });
  });

  describe('listarOcupacoesDoDia', () => {
    const entrada = {
      salaoId: 'salao-ana',
      data: '2026-09-15',
      fusoHorario: 'America/Sao_Paulo',
    };

    it('exclui o agendamento que está sendo remarcado', async () => {
      await repository.listarOcupacoesDoDia({
        ...entrada,
        ignorarAgendamentoId: 'agendamento-ana',
      });

      expect(ne).toHaveBeenCalledWith(agendamento.id, 'agendamento-ana');
    });

    it('não exclui ninguém quando nenhum agendamento é informado', async () => {
      await repository.listarOcupacoesDoDia(entrada);

      expect(ne).not.toHaveBeenCalled();
    });
  });

  describe('remarcar', () => {
    const OCORREU_EM = new Date('2026-09-15T14:10:00.000Z');
    const entrada = {
      id: 'agendamento-ana',
      salaoId: 'salao-ana',
      profissionalId: 'profissional-ana',
      dataAgendamento: '2026-09-16',
      inicioEm: new Date('2026-09-16T13:00:00.000Z'),
      duracaoMin: 60,
      ocorreuEm: OCORREU_EM,
    };
    const agendamentoRemarcado = {
      id: 'agendamento-ana',
      estado: 'agendado',
    } as AgendamentoPersistido;

    it('ignora a própria ocupação ao procurar conflito no novo horário', async () => {
      retornarConclusao.mockResolvedValue([agendamentoRemarcado]);

      await repository.remarcar(entrada);

      expect(executar).toHaveBeenCalledTimes(1);
      expect(ne).toHaveBeenCalledWith(agendamento.id, entrada.id);
      expect(eq).toHaveBeenCalledWith(
        agendamento.profissional_id,
        entrada.profissionalId,
      );
      expect(inArray).toHaveBeenCalledWith(agendamento.estado, [
        'reservado',
        'agendado',
      ]);
    });

    it('não remarca quando o novo horário já está ocupado', async () => {
      limitarConflitos.mockResolvedValue([{ id: 'agendamento-existente' }]);

      await expect(repository.remarcar(entrada)).resolves.toBeUndefined();

      expect(atualizarAgendamentos).not.toHaveBeenCalled();
      expect(inserirAgendamentos).not.toHaveBeenCalled();
    });

    it('restringe a remarcação ao salão e ao estado agendado', async () => {
      retornarConclusao.mockResolvedValue([agendamentoRemarcado]);

      await repository.remarcar(entrada);

      expect(definirConclusao).toHaveBeenCalledWith({
        inicio_em: entrada.inicioEm,
      });
      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
      expect(eq).toHaveBeenCalledWith(agendamento.estado, 'agendado');
    });

    it('não grava evento quando a corrida é perdida', async () => {
      retornarConclusao.mockResolvedValue([]);

      await expect(repository.remarcar(entrada)).resolves.toBeUndefined();

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).not.toHaveBeenCalled();
    });

    it('grava o evento de remarcação na mesma transação', async () => {
      retornarConclusao.mockResolvedValue([agendamentoRemarcado]);

      await expect(repository.remarcar(entrada)).resolves.toBe(
        agendamentoRemarcado,
      );

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(inserirAgendamentos).toHaveBeenCalledWith(eventoAgendamento);
      expect(definirAgendamentos).toHaveBeenCalledWith({
        agendamento_id: agendamentoRemarcado.id,
        tipo: 'remarcado',
        ocorreu_em: OCORREU_EM,
      });
    });
  });

  describe('listarInstantesDoPeriodo', () => {
    const entrada = {
      salaoId: 'salao-ana',
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
      fusoHorario: 'America/Sao_Paulo',
    };

    it('filtra pelo salão da requisição', async () => {
      await repository.listarInstantesDoPeriodo(entrada);

      expect(eq).toHaveBeenCalledWith(agendamento.salao_id, entrada.salaoId);
    });

    it('deriva a faixa UTC do período a partir do fuso do salão', async () => {
      await repository.listarInstantesDoPeriodo(entrada);

      expect(gte).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-09-01T03:00:00.000Z'),
      );
      expect(lt).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-10-01T03:00:00.000Z'),
      );
    });

    it('inclui o dia final inteiro no período consultado', async () => {
      await repository.listarInstantesDoPeriodo({
        ...entrada,
        dataInicio: '2026-09-15',
        dataFim: '2026-09-15',
      });

      expect(gte).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-09-15T03:00:00.000Z'),
      );
      expect(lt).toHaveBeenCalledWith(
        agendamento.inicio_em,
        new Date('2026-09-16T03:00:00.000Z'),
      );
    });

    it('não filtra por estado: o resumo conta o período inteiro', async () => {
      linhasDaAgenda = [
        { inicio_em: new Date('2026-09-15T13:00:00.000Z') },
        { inicio_em: new Date('2026-09-16T13:00:00.000Z') },
      ];

      const instantes = await repository.listarInstantesDoPeriodo(entrada);

      expect(instantes).toHaveLength(2);
      expect(inArray).not.toHaveBeenCalled();
    });
  });
});

function linhaDaAgenda({
  id,
  estado = 'agendado',
  valor_manual = null,
  valor_gateway = null,
  status_gateway = null,
}: {
  id: string;
  estado?: string;
  valor_manual?: string | null;
  valor_gateway?: string | null;
  status_gateway?: string | null;
}) {
  return {
    agendamento: { id, estado, preco_total: '150.00' },
    cliente: {
      id: 'cliente-ana',
      nome: 'Ana Paula',
      whatsapp: '+5511999999999',
    },
    procedimento: { id: 'procedimento-corte', nome: 'Corte' },
    valor_manual,
    valor_gateway,
    status_gateway,
  };
}

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
    fusoHorario: 'America/Sao_Paulo',
    bloquearProcedimentoDuplicadoNoDia: true,
  };
}
