import { NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

import type {
  JanelaSemanalPersistida,
  OverrideDisponibilidadePersistido,
  ProfissionalPersistido,
} from '@/modules/disponibilidade/contracts';
import { DisponibilidadeRepository } from '@/modules/disponibilidade/disponibilidade.repository';
import { DisponibilidadeService } from '@/modules/disponibilidade/disponibilidade.service';
import { DisponibilidadeValidator } from '@/modules/disponibilidade/disponibilidade.validator';

describe('DisponibilidadeService', () => {
  const repository = {
    listarProfissionais: jest.fn(),
    listarProfissionaisAtivos: jest.fn(),
    listarJanelasSemanaisDoDia: jest.fn(),
    listarOverridesDoDia: jest.fn(),
    buscarProfissional: jest.fn(),
    listarJanelasSemanais: jest.fn(),
    substituirJanelasSemanais: jest.fn(),
    listarOverrides: jest.fn(),
    substituirOverride: jest.fn(),
    removerOverride: jest.fn(),
  } as unknown as DisponibilidadeRepository;
  const validator = {
    validarAtualizacaoSemanal: jest.fn(),
    validarAtualizacaoOverride: jest.fn(),
    validarData: jest.fn(),
  } as unknown as DisponibilidadeValidator;
  const service = new DisponibilidadeService(repository, validator);
  const profissional = criarProfissional();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('lista profissionais apenas para o salão informado', async () => {
    jest.spyOn(repository, 'listarProfissionais').mockResolvedValue([]);

    await service.listarProfissionais('salao-ana');

    expect(repository.listarProfissionais).toHaveBeenCalledWith('salao-ana');
  });

  it('prioriza override sobre as janelas semanais do profissional', async () => {
    jest
      .spyOn(repository, 'listarProfissionaisAtivos')
      .mockResolvedValue([{ id: profissional.id }]);
    jest.spyOn(repository, 'listarJanelasSemanaisDoDia').mockResolvedValue([
      {
        profissional_id: profissional.id,
        hora_inicio: '09:00',
        hora_fim: '18:00',
      },
    ]);
    jest.spyOn(repository, 'listarOverridesDoDia').mockResolvedValue([
      {
        profissional_id: profissional.id,
        fechado: false,
        hora_inicio: '12:00',
        hora_fim: '16:00',
      },
    ]);

    await expect(
      service.listarProfissionaisComJanelasNoDia({
        salaoId: profissional.salao_id,
        data: '2026-12-25',
      }),
    ).resolves.toEqual([
      {
        id: profissional.id,
        janelas: [{ hora_inicio: '12:00', hora_fim: '16:00' }],
        fechado: false,
      },
    ]);
  });

  it('fecha o dia quando o override está marcado como fechado', async () => {
    jest
      .spyOn(repository, 'listarProfissionaisAtivos')
      .mockResolvedValue([{ id: profissional.id }]);
    jest.spyOn(repository, 'listarJanelasSemanaisDoDia').mockResolvedValue([]);
    jest.spyOn(repository, 'listarOverridesDoDia').mockResolvedValue([
      {
        profissional_id: profissional.id,
        fechado: true,
        hora_inicio: null,
        hora_fim: null,
      },
    ]);

    await expect(
      service.listarProfissionaisComJanelasNoDia({
        salaoId: profissional.salao_id,
        data: '2026-12-25',
      }),
    ).resolves.toEqual([{ id: profissional.id, janelas: [], fechado: true }]);
  });

  it('busca janelas somente após confirmar o profissional no salão', async () => {
    jest
      .spyOn(repository, 'buscarProfissional')
      .mockResolvedValue(profissional);
    jest.spyOn(repository, 'listarJanelasSemanais').mockResolvedValue([]);

    await service.buscarJanelasSemanais({
      profissionalId: profissional.id,
      salaoId: profissional.salao_id,
    });

    expect(repository.buscarProfissional).toHaveBeenCalledWith({
      profissionalId: profissional.id,
      salaoId: profissional.salao_id,
    });
    expect(repository.listarJanelasSemanais).toHaveBeenCalledWith(
      profissional.id,
    );
  });

  it('retorna 404 e não altera disponibilidade de profissional fora do salão', async () => {
    jest.spyOn(repository, 'buscarProfissional').mockResolvedValue(undefined);
    const dados = { janelas: [] };

    await expect(
      service.atualizarJanelasSemanais({
        profissionalId: 'profissional-outro-salao',
        salaoId: 'salao-ana',
        dados,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.substituirJanelasSemanais).not.toHaveBeenCalled();
    expect(validator.validarAtualizacaoSemanal).not.toHaveBeenCalled();
  });

  it('substitui o template validado do profissional do salão', async () => {
    const dados = {
      janelas: [{ dia_semana: 1, hora_inicio: '09:00', hora_fim: '18:00' }],
    };
    const janelas = [criarJanelaSemanal()];
    jest
      .spyOn(repository, 'buscarProfissional')
      .mockResolvedValue(profissional);
    jest.spyOn(validator, 'validarAtualizacaoSemanal').mockReturnValue(dados);
    jest
      .spyOn(repository, 'substituirJanelasSemanais')
      .mockResolvedValue(janelas);

    expect(
      await service.atualizarJanelasSemanais({
        profissionalId: profissional.id,
        salaoId: profissional.salao_id,
        dados,
      }),
    ).toBe(janelas);
    expect(repository.substituirJanelasSemanais).toHaveBeenCalledWith({
      profissionalId: profissional.id,
      salaoId: profissional.salao_id,
      dados,
    });
  });

  it('cria ou substitui override validado por data', async () => {
    const dados = {
      fechado: false as const,
      janelas: [{ hora_inicio: '09:00', hora_fim: '18:00' }],
    };
    const override = criarOverride();
    jest
      .spyOn(repository, 'buscarProfissional')
      .mockResolvedValue(profissional);
    jest.spyOn(validator, 'validarAtualizacaoOverride').mockReturnValue(dados);
    jest.spyOn(validator, 'validarData').mockReturnValue('2026-12-25');
    jest.spyOn(repository, 'substituirOverride').mockResolvedValue(override);

    expect(
      await service.atualizarOverride({
        profissionalId: profissional.id,
        salaoId: profissional.salao_id,
        data: '2026-12-25',
        dados,
      }),
    ).toBe(override);
    expect(repository.substituirOverride).toHaveBeenCalledWith({
      profissionalId: profissional.id,
      salaoId: profissional.salao_id,
      data: '2026-12-25',
      dados,
    });
  });

  it('remove override sem exigir que ele exista', async () => {
    jest
      .spyOn(repository, 'buscarProfissional')
      .mockResolvedValue(profissional);
    jest.spyOn(validator, 'validarData').mockReturnValue('2026-12-25');
    jest.spyOn(repository, 'removerOverride').mockResolvedValue();

    await expect(
      service.removerOverride({
        profissionalId: profissional.id,
        salaoId: profissional.salao_id,
        data: '2026-12-25',
      }),
    ).resolves.toBeUndefined();
    expect(repository.removerOverride).toHaveBeenCalledWith({
      profissionalId: profissional.id,
      salaoId: profissional.salao_id,
      data: '2026-12-25',
    });
  });
});

function criarProfissional(): ProfissionalPersistido {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    nome: 'Ana',
    ativo: true,
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function criarJanelaSemanal(): JanelaSemanalPersistida {
  return {
    id: 'd7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    profissional_id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    dia_semana: 1,
    hora_inicio: '09:00:00',
    hora_fim: '18:00:00',
  };
}

function criarOverride(): OverrideDisponibilidadePersistido {
  return {
    id: 'e7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    profissional_id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    data: '2026-12-25',
    fechado: false,
    janelas: [
      {
        id: 'f7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
        override_id: 'e7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
        hora_inicio: '09:00:00',
        hora_fim: '18:00:00',
      },
    ],
  };
}
