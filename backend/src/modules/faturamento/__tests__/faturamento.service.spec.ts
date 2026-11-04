import { BadRequestException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

jest.mock('@fluy/schema', () => ({}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class SalaoConsultaService {},
}));
jest.mock('@/modules/faturamento/faturamento.repository', () => ({
  FaturamentoRepository: class FaturamentoRepository {},
}));

import { codificarCursorPagina } from '@/shared/paginacao/paginacao.utils';
import type { EncerramentoPersistido } from '@/modules/faturamento/contracts';
import { FaturamentoRepository } from '@/modules/faturamento/faturamento.repository';
import { FaturamentoService } from '@/modules/faturamento/faturamento.service';
import { TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO } from '@/modules/faturamento/faturamento-data';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

describe('FaturamentoService', () => {
  const repository = {
    listarEncerramentosDoPeriodo: jest.fn(),
    listarAtendimentosDoPeriodo: jest.fn(),
    listarSinaisRetidosDoPeriodo: jest.fn(),
  } as unknown as FaturamentoRepository;
  const salaoConsultaService = {
    obterFusoHorario: jest.fn(),
  } as unknown as SalaoConsultaService;
  const service = new FaturamentoService(repository, salaoConsultaService);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: new Date('2026-10-01T01:00:00.000Z') });
    jest
      .spyOn(salaoConsultaService, 'obterFusoHorario')
      .mockResolvedValue('America/Sao_Paulo');
    jest
      .spyOn(repository, 'listarEncerramentosDoPeriodo')
      .mockResolvedValue([]);
    jest.spyOn(repository, 'listarAtendimentosDoPeriodo').mockResolvedValue([]);
    jest
      .spyOn(repository, 'listarSinaisRetidosDoPeriodo')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('buscar', () => {
    it('resolve o "hoje" do preset no fuso do salão, não em UTC', async () => {
      // 01/10 às 01:00 UTC ainda é 30/09 em São Paulo.
      const resultado = await service.buscar({
        salaoId: 'salao-ana',
        dados: { periodo: 'mes_atual' },
      });

      expect(resultado.periodo).toEqual({
        dataInicio: '2026-09-01',
        dataFim: '2026-09-30',
      });
      expect(repository.listarEncerramentosDoPeriodo).toHaveBeenCalledWith({
        salaoId: 'salao-ana',
        inicio: new Date('2026-09-01T03:00:00.000Z'),
        fim: new Date('2026-10-01T03:00:00.000Z'),
      });
    });

    it('consulta só o salão da requisição e devolve o fuso dele', async () => {
      const resultado = await service.buscar({
        salaoId: 'salao-ana',
        dados: { data_inicio: '2026-09-01', data_fim: '2026-09-15' },
      });

      expect(salaoConsultaService.obterFusoHorario).toHaveBeenCalledWith(
        'salao-ana',
      );
      expect(repository.listarEncerramentosDoPeriodo).toHaveBeenCalledWith(
        expect.objectContaining({ salaoId: 'salao-ana' }),
      );
      expect(resultado.fusoHorario).toBe('America/Sao_Paulo');
    });
  });

  describe('listarSinaisRetidos', () => {
    const dados = { data_inicio: '2026-09-01', data_fim: '2026-09-30' };
    it('pagina os sinais sem limitar os totais financeiros do período', async () => {
      const encerramentos = Array.from({ length: 25 }, (_, i) => ({
        ...criarEncerramento('sinal-' + i),
        tipo: 'cancelado' as const,
        cancelado_por: 'cliente' as const,
        pagamentos: [
          {
            tipo: 'sinal' as const,
            origem: 'manual' as const,
            metodo: 'dinheiro' as const,
            valor_centavos: 1000,
          },
        ],
      }));
      jest
        .spyOn(repository, 'listarEncerramentosDoPeriodo')
        .mockResolvedValue(encerramentos);
      jest
        .spyOn(repository, 'listarSinaisRetidosDoPeriodo')
        .mockResolvedValue(encerramentos.slice(0, 21));
      const resumo = await service.buscar({ salaoId: 'salao-ana', dados });
      const pagina = await service.listarSinaisRetidos({
        salaoId: 'salao-ana',
        dados,
      });
      expect(resumo.resumo.total_faturado_centavos).toBe(25000);
      expect(resumo.recebimentoPorMetodo[0].valor_centavos).toBe(25000);
      expect(resumo).not.toHaveProperty('sinaisRetidos');
      expect(pagina.itens).toHaveLength(20);
      expect(pagina.proximoCursor).toBe(codificarCursorPagina({ offset: 20 }));
      expect(pagina.itens[0].motivo).toBe('cancelamento_cliente');
      expect(repository.listarSinaisRetidosDoPeriodo).toHaveBeenCalledWith({
        salaoId: 'salao-ana',
        inicio: new Date('2026-09-01T03:00:00.000Z'),
        fim: new Date('2026-10-01T03:00:00.000Z'),
        offset: 0,
        limite: 21,
      });
    });
    it('aplica o cursor e encerra a paginação na última página', async () => {
      const resultado = await service.listarSinaisRetidos({
        salaoId: 'salao-ana',
        dados: { ...dados, cursor: codificarCursorPagina({ offset: 20 }) },
      });
      expect(repository.listarSinaisRetidosDoPeriodo).toHaveBeenCalledWith(
        expect.objectContaining({
          salaoId: 'salao-ana',
          offset: 20,
          limite: 21,
        }),
      );
      expect(resultado).toEqual({
        fusoHorario: 'America/Sao_Paulo',
        itens: [],
        proximoCursor: null,
      });
    });
    it('recusa cursor inválido antes de consultar o banco', async () => {
      await expect(
        service.listarSinaisRetidos({
          salaoId: 'salao-ana',
          dados: { ...dados, cursor: 'invalido' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.listarSinaisRetidosDoPeriodo).not.toHaveBeenCalled();
    });
  });

  describe('listarAtendimentos', () => {
    const dados = { data_inicio: '2026-09-01', data_fim: '2026-09-30' };

    it('busca uma linha além da página para saber se há próxima', async () => {
      jest
        .spyOn(repository, 'listarAtendimentosDoPeriodo')
        .mockResolvedValue(
          Array.from(
            { length: TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO + 1 },
            (_, indice) => criarEncerramento(`agendamento-${indice}`),
          ),
        );

      const resultado = await service.listarAtendimentos({
        salaoId: 'salao-ana',
        dados,
      });

      expect(repository.listarAtendimentosDoPeriodo).toHaveBeenCalledWith(
        expect.objectContaining({
          salaoId: 'salao-ana',
          offset: 0,
          limite: TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO + 1,
        }),
      );
      expect(resultado.itens).toHaveLength(
        TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO,
      );
      expect(resultado.proximoCursor).toBe(
        codificarCursorPagina({
          offset: TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO,
        }),
      );
    });

    it('continua do offset do cursor recebido', async () => {
      await service.listarAtendimentos({
        salaoId: 'salao-ana',
        dados: { ...dados, cursor: codificarCursorPagina({ offset: 40 }) },
      });

      expect(repository.listarAtendimentosDoPeriodo).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 40 }),
      );
    });

    it('recusa cursor inválido', async () => {
      await expect(
        service.listarAtendimentos({
          salaoId: 'salao-ana',
          dados: { ...dados, cursor: 'nao-e-cursor' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.listarAtendimentosDoPeriodo).not.toHaveBeenCalled();
    });
  });
});

function criarEncerramento(agendamentoId: string): EncerramentoPersistido {
  return {
    agendamento_id: agendamentoId,
    tipo: 'concluido',
    ocorreu_em: new Date('2026-09-10T15:00:00.000Z'),
    cancelado_por: null,
    preco_total_centavos: 10000,
    cliente: { id: 'cliente-ana', nome: 'Ana' },
    procedimento: { id: 'procedimento-corte', nome: 'Corte' },
    pagamentos: [],
  };
}
