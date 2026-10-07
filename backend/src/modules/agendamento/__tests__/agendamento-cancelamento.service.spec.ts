// A cadeia de imports do `AgendamentoService` chega em `@nestjs/schedule`, que
// é ESM e quebra no transform do Jest.
jest.mock('@/modules/agendamento/agendamento.service', () => ({
  AgendamentoService: class {},
}));

jest.mock('@/modules/aviso/agendamento-aviso.service', () => ({
  AgendamentoAvisoService: class {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AgendamentoDaAgendaPersistido } from '@/modules/agendamento/contracts';
import { AgendamentoCancelamentoService } from '@/modules/agendamento/agendamento-cancelamento.service';
import type { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import type { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';

describe('AgendamentoCancelamentoService', () => {
  const buscarDetalheNoRepository = jest.fn();
  const cancelarNoRepository = jest.fn();
  const buscarDetalheNoService = jest.fn();
  const notificarCancelamento = jest.fn();
  const repository = {
    buscarDetalhe: buscarDetalheNoRepository,
    cancelar: cancelarNoRepository,
  } as unknown as AgendamentoRepository;
  const agendamentoService = {
    buscarDetalhe: buscarDetalheNoService,
  } as unknown as AgendamentoService;
  const service = new AgendamentoCancelamentoService(
    repository,
    agendamentoService,
    new AgendamentoValidator(),
    { notificarCancelamento } as unknown as AgendamentoAvisoService,
  );
  const entrada = {
    id: 'agendamento-ana',
    salaoId: 'salao-ana',
    dados: {},
    canceladoPor: 'salao' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    buscarDetalheNoRepository.mockResolvedValue(criarAgendamentoPersistido());
    cancelarNoRepository.mockResolvedValue({ id: entrada.id });
    buscarDetalheNoService.mockResolvedValue({ id: entrada.id });
    notificarCancelamento.mockResolvedValue(undefined);
  });

  it('não encontra agendamento de outro salão', async () => {
    buscarDetalheNoRepository.mockResolvedValue(undefined);

    await expect(service.cancelar(entrada)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(buscarDetalheNoRepository).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(cancelarNoRepository).not.toHaveBeenCalled();
  });

  it('leva o salão da requisição até o repository', async () => {
    await service.cancelar(entrada);

    expect(cancelarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ id: entrada.id, salaoId: entrada.salaoId }),
    );
  });

  it('repassa o motivo informado', async () => {
    await service.cancelar({
      ...entrada,
      dados: { motivo: 'Profissional doente' },
    });

    expect(cancelarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: 'Profissional doente' }),
    );
  });

  it('repassa quem cancelou até o repository', async () => {
    await service.cancelar({ ...entrada, canceladoPor: 'cliente' });

    expect(cancelarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ canceladoPor: 'cliente' }),
    );
  });

  it('cancela sem motivo quando ele não é informado', async () => {
    await service.cancelar(entrada);

    expect(cancelarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: undefined }),
    );
  });

  it('cancela agendamento ainda reservado', async () => {
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({ estado: 'reservado' }),
    );

    await expect(service.cancelar(entrada)).resolves.toEqual({
      id: entrada.id,
    });
  });

  it.each(['concluido', 'cancelado', 'falta'] as const)(
    'recusa cancelar agendamento já encerrado em %s',
    async (estado) => {
      buscarDetalheNoRepository.mockResolvedValue(
        criarAgendamentoPersistido({ estado }),
      );

      await expect(service.cancelar(entrada)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(cancelarNoRepository).not.toHaveBeenCalled();
    },
  );

  it('devolve conflito quando outra requisição encerrou primeiro', async () => {
    cancelarNoRepository.mockResolvedValue(undefined);

    await expect(service.cancelar(entrada)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(buscarDetalheNoService).not.toHaveBeenCalled();
  });

  it('devolve o detalhe atualizado depois de cancelar', async () => {
    const detalhe = await service.cancelar(entrada);

    expect(buscarDetalheNoService).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(detalhe).toEqual({ id: entrada.id });
  });

  it('cria o aviso da cliente quando o salão cancela', async () => {
    const detalhe = { id: entrada.id, estado: 'cancelado' };
    buscarDetalheNoService.mockResolvedValue(detalhe);

    await service.cancelar(entrada);

    expect(notificarCancelamento).toHaveBeenCalledWith(detalhe);
  });

  it('não avisa a cliente sobre o cancelamento feito por ela mesma', async () => {
    await service.cancelar({ ...entrada, notificarCliente: false });

    expect(notificarCancelamento).not.toHaveBeenCalled();
  });
});

function criarAgendamentoPersistido(
  sobrescritas: Partial<AgendamentoDaAgendaPersistido> = {},
): AgendamentoDaAgendaPersistido {
  return {
    id: 'agendamento-ana',
    salao_id: 'salao-ana',
    estado: 'agendado',
    inicio_em: new Date('2026-09-15T13:00:00.000Z'),
    preco_total: '120.00',
    valor_sinal: '36.00',
    pagamentos: [],
    ...sobrescritas,
  } as AgendamentoDaAgendaPersistido;
}
