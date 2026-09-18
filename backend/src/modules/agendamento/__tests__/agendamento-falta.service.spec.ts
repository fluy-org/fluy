// A cadeia de imports do `AgendamentoService` chega em `@nestjs/schedule`, que
// é ESM e quebra no transform do Jest.
jest.mock('@/modules/agendamento/agendamento.service', () => ({
  AgendamentoService: class {},
}));

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { AgendamentoDaAgendaPersistido } from '@/modules/agendamento/contracts';
import { AgendamentoFaltaService } from '@/modules/agendamento/agendamento-falta.service';
import type { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

describe('AgendamentoFaltaService', () => {
  const buscarDetalheNoRepository = jest.fn();
  const marcarFaltaNoRepository = jest.fn();
  const buscarDetalheNoService = jest.fn();
  const repository = {
    buscarDetalhe: buscarDetalheNoRepository,
    marcarFalta: marcarFaltaNoRepository,
  } as unknown as AgendamentoRepository;
  const agendamentoService = {
    buscarDetalhe: buscarDetalheNoService,
  } as unknown as AgendamentoService;
  const service = new AgendamentoFaltaService(
    repository,
    agendamentoService,
    new AgendamentoValidator(),
  );
  const entrada = { id: 'agendamento-ana', salaoId: 'salao-ana' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-09-15T13:30:00.000Z'));
    buscarDetalheNoRepository.mockResolvedValue(criarAgendamentoPersistido());
    marcarFaltaNoRepository.mockResolvedValue({ id: entrada.id });
    buscarDetalheNoService.mockResolvedValue({ id: entrada.id });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('não encontra agendamento de outro salão', async () => {
    buscarDetalheNoRepository.mockResolvedValue(undefined);

    await expect(service.marcarFalta(entrada)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(buscarDetalheNoRepository).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(marcarFaltaNoRepository).not.toHaveBeenCalled();
  });

  it('leva o salão da requisição até o repository', async () => {
    await service.marcarFalta(entrada);

    expect(marcarFaltaNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ id: entrada.id, salaoId: entrada.salaoId }),
    );
  });

  it('recusa marcar falta antes de o atendimento começar', async () => {
    jest.setSystemTime(new Date('2026-09-15T12:59:00.000Z'));

    await expect(service.marcarFalta(entrada)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(marcarFaltaNoRepository).not.toHaveBeenCalled();
  });

  it('aceita marcar falta dentro da tolerância de atraso', async () => {
    jest.setSystemTime(new Date('2026-09-15T13:05:00.000Z'));

    await expect(service.marcarFalta(entrada)).resolves.toEqual({
      id: entrada.id,
    });
  });

  it('grava o evento no instante da marcação, não no de inicio_em', async () => {
    const agora = new Date('2026-09-15T14:10:00.000Z');
    jest.setSystemTime(agora);

    await service.marcarFalta(entrada);

    expect(marcarFaltaNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ ocorreuEm: agora }),
    );
  });

  it.each(['concluido', 'cancelado', 'falta'] as const)(
    'recusa marcar falta de agendamento já encerrado em %s',
    async (estado) => {
      buscarDetalheNoRepository.mockResolvedValue(
        criarAgendamentoPersistido({ estado }),
      );

      await expect(service.marcarFalta(entrada)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(marcarFaltaNoRepository).not.toHaveBeenCalled();
    },
  );

  it('devolve conflito quando outra requisição encerrou primeiro', async () => {
    marcarFaltaNoRepository.mockResolvedValue(undefined);

    await expect(service.marcarFalta(entrada)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(buscarDetalheNoService).not.toHaveBeenCalled();
  });

  it('devolve o detalhe atualizado depois de marcar', async () => {
    const detalhe = await service.marcarFalta(entrada);

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
    inicio_em: new Date('2026-09-15T13:00:00.000Z'),
    preco_total: '120.00',
    valor_sinal: '36.00',
    pagamentos: [],
    ...sobrescritas,
  } as AgendamentoDaAgendaPersistido;
}
