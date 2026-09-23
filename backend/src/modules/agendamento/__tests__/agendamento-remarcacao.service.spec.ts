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
import type {
  AgendamentoDetalhePersistido,
  AvaliacaoHorarioAgendamento,
} from '@/modules/agendamento/contracts';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoRemarcacaoService } from '@/modules/agendamento/agendamento-remarcacao.service';
import type { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

describe('AgendamentoRemarcacaoService', () => {
  const avaliarHorarioNoMotor = jest.fn();
  const listarHorariosLivresNoMotor = jest.fn();
  const buscarDetalheNoRepository = jest.fn();
  const remarcarNoRepository = jest.fn();
  const buscarDadosParaAvaliacao = jest.fn();
  const montarDadosParaAvaliar = jest.fn();
  const buscarDetalheNoService = jest.fn();
  const motor = {
    avaliarHorario: avaliarHorarioNoMotor,
    listarHorariosLivres: listarHorariosLivresNoMotor,
  } as unknown as AgendamentoDisponibilidadeService;
  const repository = {
    buscarDetalhe: buscarDetalheNoRepository,
    remarcar: remarcarNoRepository,
  } as unknown as AgendamentoRepository;
  const agendamentoService = {
    buscarDadosParaAvaliacaoHorario: buscarDadosParaAvaliacao,
    montarDadosParaAvaliarDisponibilidade: montarDadosParaAvaliar,
    buscarDetalhe: buscarDetalheNoService,
  } as unknown as AgendamentoService;
  const service = new AgendamentoRemarcacaoService(
    motor,
    repository,
    agendamentoService,
    new AgendamentoValidator(),
  );
  // 10:00 em America/Sao_Paulo no dia pedido.
  const INICIO_NOVO = new Date('2026-09-16T13:00:00.000Z');
  const entrada = {
    id: 'agendamento-ana',
    salaoId: 'salao-ana',
    dados: {
      data: '2026-09-16',
      hora_inicio: '10:00',
      confirmar_excecoes: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    buscarDetalheNoRepository.mockResolvedValue(criarAgendamentoPersistido());
    buscarDadosParaAvaliacao.mockResolvedValue({
      profissionais: [
        { id: 'profissional-ana', janelas: [], fechado: false },
        { id: 'profissional-beatriz', janelas: [], fechado: false },
      ],
    });
    montarDadosParaAvaliar.mockReturnValue({
      fusoHorario: 'America/Sao_Paulo',
    });
    avaliarHorarioNoMotor.mockReturnValue(criarAvaliacao());
    listarHorariosLivresNoMotor.mockReturnValue(['09:00', '10:00']);
    remarcarNoRepository.mockResolvedValue({ id: entrada.id });
    buscarDetalheNoService.mockResolvedValue({ id: entrada.id });
  });

  it('não encontra agendamento de outro salão', async () => {
    buscarDetalheNoRepository.mockResolvedValue(undefined);

    await expect(service.remarcar(entrada)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(remarcarNoRepository).not.toHaveBeenCalled();
  });

  it('avalia com a duração congelada e sem a ocupação do próprio agendamento', async () => {
    await service.remarcar(entrada);

    expect(buscarDadosParaAvaliacao).toHaveBeenCalledWith({
      salaoId: entrada.salaoId,
      procedimentoId: 'procedimento-corte',
      data: entrada.dados.data,
      ignorarAgendamentoId: entrada.id,
    });
    expect(montarDadosParaAvaliar).toHaveBeenCalledWith(
      expect.objectContaining({ duracaoMin: 60 }),
    );
  });

  it('avalia apenas a profissional do agendamento', async () => {
    await service.remarcar(entrada);

    expect(montarDadosParaAvaliar).toHaveBeenCalledWith(
      expect.objectContaining({
        dadosParaAvaliacao: expect.objectContaining({
          profissionais: [
            { id: 'profissional-ana', janelas: [], fechado: false },
          ],
        }) as unknown,
      }),
    );
  });

  it('converte data e hora civis para o instante no fuso do salão', async () => {
    await service.remarcar(entrada);

    expect(remarcarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ inicioEm: INICIO_NOVO }),
    );
  });

  it('leva o salão da requisição e preserva a profissional do agendamento', async () => {
    await service.remarcar(entrada);

    expect(remarcarNoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entrada.id,
        salaoId: entrada.salaoId,
        profissionalId: 'profissional-ana',
        duracaoMin: 60,
        dataAgendamento: entrada.dados.data,
      }),
    );
  });

  it.each(['concluido', 'cancelado', 'falta'] as const)(
    'recusa remarcar agendamento já encerrado em %s',
    async (estado) => {
      buscarDetalheNoRepository.mockResolvedValue(
        criarAgendamentoPersistido({ estado }),
      );

      await expect(service.remarcar(entrada)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(remarcarNoRepository).not.toHaveBeenCalled();
    },
  );

  it('recusa remarcar para o horário que o agendamento já tem', async () => {
    buscarDetalheNoRepository.mockResolvedValue(
      criarAgendamentoPersistido({ inicio_em: INICIO_NOVO }),
    );

    await expect(service.remarcar(entrada)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(remarcarNoRepository).not.toHaveBeenCalled();
  });

  it('pede ao motor que bloqueie horário no passado', async () => {
    await service.remarcar(entrada);

    expect(avaliarHorarioNoMotor).toHaveBeenCalledWith(
      expect.objectContaining({ bloquearInicioPassado: true }),
    );
  });

  it('recusa remarcar para o passado mesmo com exceções confirmadas', async () => {
    avaliarHorarioNoMotor.mockReturnValue(
      criarAvaliacao({
        status: 'indisponivel',
        bloqueios: ['inicio_passado'],
      }),
    );

    await expect(
      service.remarcar({
        ...entrada,
        dados: { ...entrada.dados, confirmar_excecoes: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(remarcarNoRepository).not.toHaveBeenCalled();
  });

  it('recusa encaixe fora da janela enquanto as exceções não são confirmadas', async () => {
    avaliarHorarioNoMotor.mockReturnValue(
      criarAvaliacao({ status: 'requer_confirmacao', avisos: ['fora_janela'] }),
    );

    await expect(service.remarcar(entrada)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('aceita encaixe fora da janela com exceções confirmadas', async () => {
    avaliarHorarioNoMotor.mockReturnValue(
      criarAvaliacao({ status: 'requer_confirmacao', avisos: ['fora_janela'] }),
    );

    await expect(
      service.remarcar({
        ...entrada,
        dados: { ...entrada.dados, confirmar_excecoes: true },
      }),
    ).resolves.toEqual({ id: entrada.id });
  });

  it('recusa data com override fechado', async () => {
    avaliarHorarioNoMotor.mockReturnValue(
      criarAvaliacao({ status: 'indisponivel', bloqueios: ['dia_fechado'] }),
    );

    await expect(
      service.remarcar({
        ...entrada,
        dados: { ...entrada.dados, confirmar_excecoes: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(remarcarNoRepository).not.toHaveBeenCalled();
  });

  it('avisa que o horário foi tomado quando o agendamento segue agendado', async () => {
    remarcarNoRepository.mockResolvedValue(undefined);

    await expect(service.remarcar(entrada)).rejects.toThrow(
      'O horário deixou de estar disponível.',
    );
  });

  it('avisa que o agendamento encerrou quando ele perdeu a corrida', async () => {
    remarcarNoRepository.mockResolvedValue(undefined);
    buscarDetalheNoRepository
      .mockResolvedValueOnce(criarAgendamentoPersistido())
      .mockResolvedValueOnce(
        criarAgendamentoPersistido({ estado: 'cancelado' }),
      );

    await expect(service.remarcar(entrada)).rejects.toThrow(
      'Este agendamento já foi encerrado.',
    );
  });

  it('devolve o detalhe atualizado depois de remarcar', async () => {
    const detalhe = await service.remarcar(entrada);

    expect(buscarDetalheNoService).toHaveBeenCalledWith({
      id: entrada.id,
      salaoId: entrada.salaoId,
    });
    expect(detalhe).toEqual({ id: entrada.id });
  });

  describe('listarHorariosLivres', () => {
    const consulta = {
      id: entrada.id,
      salaoId: entrada.salaoId,
      dados: { data: entrada.dados.data },
    };

    it('oferece os horários do motor no dia pedido', async () => {
      await expect(service.listarHorariosLivres(consulta)).resolves.toEqual({
        data: consulta.dados.data,
        horarios: [{ hora_inicio: '09:00' }, { hora_inicio: '10:00' }],
      });
    });

    it('não oferece horários de agendamento de outro salão', async () => {
      buscarDetalheNoRepository.mockResolvedValue(undefined);

      await expect(
        service.listarHorariosLivres(consulta),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('avaliarHorario', () => {
    it('devolve a avaliação do horário alvo', async () => {
      const avaliacao = criarAvaliacao({
        status: 'requer_confirmacao',
        avisos: ['fora_janela'],
      });
      avaliarHorarioNoMotor.mockReturnValue(avaliacao);

      await expect(
        service.avaliarHorario({
          id: entrada.id,
          salaoId: entrada.salaoId,
          dados: { data: entrada.dados.data, hora_inicio: '10:00' },
        }),
      ).resolves.toBe(avaliacao);
    });
  });
});

function criarAvaliacao(
  sobrescritas: Partial<AvaliacaoHorarioAgendamento> = {},
): AvaliacaoHorarioAgendamento {
  return {
    status: 'disponivel',
    avisos: [],
    bloqueios: [],
    profissionalId: 'profissional-ana',
    ...sobrescritas,
  };
}

function criarAgendamentoPersistido(
  sobrescritas: Partial<AgendamentoDetalhePersistido> = {},
): AgendamentoDetalhePersistido {
  return {
    id: 'agendamento-ana',
    salao_id: 'salao-ana',
    profissional_id: 'profissional-ana',
    procedimento_id: 'procedimento-corte',
    estado: 'agendado',
    inicio_em: new Date('2026-09-15T13:00:00.000Z'),
    duracao_min: 60,
    preco_total: '120.00',
    valor_sinal: '36.00',
    pagamentos: [],
    remarcado_vezes: 0,
    ...sobrescritas,
  } as AgendamentoDetalhePersistido;
}
