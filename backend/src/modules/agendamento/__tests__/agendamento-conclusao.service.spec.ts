// A cadeia de imports do `AgendamentoService` chega em `@nestjs/schedule`, que
// é ESM e quebra no transform do Jest.
jest.mock('@/modules/agendamento/agendamento.service', () => ({
  AgendamentoService: class {},
}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class {},
}));

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  AgendamentoDaAgendaPersistido,
  PagamentoDoAgendamentoPersistido,
} from '@/modules/agendamento/contracts';
import { AgendamentoConclusaoService } from '@/modules/agendamento/agendamento-conclusao.service';
import type { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import type { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

describe('AgendamentoConclusaoService', () => {
  const buscarDetalheNoRepository = jest.fn();
  const concluirNoRepository = jest.fn();
  const buscarDetalheNoService = jest.fn();
  const repository = {
    buscarDetalhe: buscarDetalheNoRepository,
    concluir: concluirNoRepository,
  } as unknown as AgendamentoRepository;
  const agendamentoService = {
    buscarDetalhe: buscarDetalheNoService,
  } as unknown as AgendamentoService;
  const obterFusoHorario = jest.fn();
  const salaoConsultaService = {
    obterFusoHorario,
  } as unknown as SalaoConsultaService;
  const service = new AgendamentoConclusaoService(
    repository,
    agendamentoService,
    new AgendamentoValidator(),
    salaoConsultaService,
  );
  const entrada = {
    id: 'agendamento-ana',
    salaoId: 'salao-ana',
    usuarioSalaoId: 'usuario-salao-ana',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    buscarDetalheNoRepository.mockResolvedValue(criarAgendamentoPersistido());
    concluirNoRepository.mockResolvedValue({ id: entrada.id });
    buscarDetalheNoService.mockResolvedValue({ id: entrada.id });
    obterFusoHorario.mockResolvedValue('America/Sao_Paulo');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('não encontra agendamento de outro salão', async () => {
    buscarDetalheNoRepository.mockResolvedValue(undefined);

    await expect(
      service.concluir({ ...entrada, dados: { metodo_pagamento: null } }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(buscarDetalheNoRepository).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(concluirNoRepository).not.toHaveBeenCalled();
  });

  it('registra a cobrança pelo valor pendente, não pelo preço total', async () => {
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({ pagamentos: [pagamentoManual('36.00')] }),
    );

    await service.concluir({
      ...entrada,
      dados: { metodo_pagamento: 'dinheiro' },
    });

    expect(concluirNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entrada.id,
        salaoId: entrada.salaoId,
        cobranca: {
          valor: '84.00',
          metodo: 'dinheiro',
          registradaPor: entrada.usuarioSalaoId,
        },
      }),
    );
  });

  it('não registra cobrança quando o salão marca que não recebeu', async () => {
    await service.concluir({ ...entrada, dados: { metodo_pagamento: null } });

    expect(concluirNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ cobranca: undefined }),
    );
  });

  it('recusa registrar pagamento sem vínculo de usuário do salão', async () => {
    await expect(
      service.concluir({
        ...entrada,
        usuarioSalaoId: null,
        dados: { metodo_pagamento: 'pix_pessoal' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(concluirNoRepository).not.toHaveBeenCalled();
  });

  it('recusa conclusão de agendamento já encerrado', async () => {
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({ estado: 'concluido' }),
    );

    await expect(
      service.concluir({ ...entrada, dados: { metodo_pagamento: null } }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(concluirNoRepository).not.toHaveBeenCalled();
  });

  it('devolve conflito quando outra requisição concluiu primeiro', async () => {
    concluirNoRepository.mockResolvedValue(undefined);

    await expect(
      service.concluir({ ...entrada, dados: { metodo_pagamento: null } }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(buscarDetalheNoService).not.toHaveBeenCalled();
  });

  it('cria o lembrete de manutenção no dia civil do salão', async () => {
    // 23h30 em São Paulo já é o dia seguinte em UTC.
    jest.useFakeTimers({ now: new Date('2026-09-16T02:30:00.000Z') });
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({
        procedimento: {
          id: 'procedimento-corte',
          nome: 'Corte',
          periodo_manutencao_dias: 30,
        },
      }),
    );

    await service.concluir({ ...entrada, dados: { metodo_pagamento: null } });

    expect(obterFusoHorario).toHaveBeenCalledWith(entrada.salaoId);
    expect(concluirNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        lembrete: {
          texto: 'Retorno de manutenção — Corte',
          dataAlvo: '2026-10-15',
        },
      }),
    );
  });

  it.each([null, 0])(
    'não cria lembrete quando o período de manutenção é %p',
    async (periodo) => {
      buscarDetalheNoRepository.mockResolvedValue(
        criarAgendamentoPersistido({
          procedimento: {
            id: 'procedimento-corte',
            nome: 'Corte',
            periodo_manutencao_dias: periodo,
          },
        }),
      );

      await service.concluir({ ...entrada, dados: { metodo_pagamento: null } });

      expect(concluirNoRepository).toHaveBeenCalledWith(
        expect.objectContaining({ lembrete: undefined }),
      );
      expect(obterFusoHorario).not.toHaveBeenCalled();
    },
  );

  it('conclui sem lembrete quando o período passa do teto', async () => {
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({
        procedimento: {
          id: 'procedimento-corte',
          nome: 'Corte',
          periodo_manutencao_dias: 2_147_483_647,
        },
      }),
    );

    await service.concluir({ ...entrada, dados: { metodo_pagamento: null } });

    expect(concluirNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ lembrete: undefined }),
    );
  });

  it('devolve o detalhe atualizado depois de concluir', async () => {
    const detalhe = await service.concluir({
      ...entrada,
      dados: { metodo_pagamento: null },
    });

    expect(buscarDetalheNoService).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(detalhe).toEqual({ id: entrada.id });
  });
});

function criarAgendamentoPersistido(
  sobrescritas: Partial<AgendamentoDaAgendaPersistido> = {},
): AgendamentoDaAgendaPersistido {
  return {
    id: 'agendamento-ana',
    salao_id: 'salao-ana',
    estado: 'agendado',
    preco_total: '120.00',
    valor_sinal: '36.00',
    procedimento: {
      id: 'procedimento-corte',
      nome: 'Corte',
      periodo_manutencao_dias: null,
    },
    pagamentos: [],
    ...sobrescritas,
  } as AgendamentoDaAgendaPersistido;
}

function pagamentoManual(valor: string): PagamentoDoAgendamentoPersistido {
  return { valor, status: null };
}
