import { NotFoundException } from '@nestjs/common';

jest.mock('@fluy/schema', () => ({}));

import type {
  AtualizarProcedimentoInput,
  BuscarProcedimentoInput,
  CriarProcedimentoInput,
  ProcedimentoPersistido,
} from '@/modules/procedimento/contracts';
import { ProcedimentoRepository } from '@/modules/procedimento/procedimento.repository';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';
import { ProcedimentoValidator } from '@/modules/procedimento/procedimento.validator';

describe('ProcedimentoService', () => {
  const repository = {
    criar: jest.fn(),
    listar: jest.fn(),
    listarAtivos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    desativar: jest.fn(),
  } as unknown as ProcedimentoRepository;
  const validator = {
    validarCriacao: jest.fn(),
    validarAtualizacao: jest.fn(),
  } as unknown as ProcedimentoValidator;
  const service = new ProcedimentoService(repository, validator);
  const procedimento = criarProcedimentoPersistido();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('cria o procedimento validado no salão informado', async () => {
    const input: CriarProcedimentoInput = {
      salaoId: 'salao-ana',
      dados: {
        nome: 'Corte',
        duracao_min: 30,
        preco: 100,
        tipo_sinal: 'fixo',
        valor_sinal: 20,
      },
    };
    const dadosValidados = { ...input.dados, valor_sinal: 0 };
    jest.spyOn(validator, 'validarCriacao').mockReturnValue(dadosValidados);
    jest.spyOn(repository, 'criar').mockResolvedValue(procedimento);

    expect(await service.criar(input)).toBe(procedimento);
    expect(validator.validarCriacao).toHaveBeenCalledWith(input.dados);
    expect(repository.criar).toHaveBeenCalledWith({
      salaoId: input.salaoId,
      dados: dadosValidados,
    });
  });

  it('lista procedimentos no salão informado', async () => {
    jest.spyOn(repository, 'listar').mockResolvedValue([procedimento]);

    expect(await service.listar('salao-ana')).toEqual([procedimento]);
    expect(repository.listar).toHaveBeenCalledWith('salao-ana');
  });

  it('lista apenas os procedimentos ativos no salão informado', async () => {
    jest.spyOn(repository, 'listarAtivos').mockResolvedValue([procedimento]);

    expect(await service.listarAtivos('salao-ana')).toEqual([procedimento]);
    expect(repository.listarAtivos).toHaveBeenCalledWith('salao-ana');
  });

  it('atualiza o procedimento validado no salão informado', async () => {
    const input: AtualizarProcedimentoInput = {
      id: procedimento.id,
      salaoId: procedimento.salao_id,
      dados: { preco: 0 },
    };
    const dadosValidados = { preco: 0, valor_sinal: 0 };
    jest.spyOn(repository, 'buscarPorId').mockResolvedValue(procedimento);
    jest.spyOn(validator, 'validarAtualizacao').mockReturnValue(dadosValidados);
    jest.spyOn(repository, 'atualizar').mockResolvedValue(procedimento);

    expect(await service.atualizar(input)).toBe(procedimento);
    expect(repository.buscarPorId).toHaveBeenCalledWith(input);
    expect(validator.validarAtualizacao).toHaveBeenCalledWith({
      dados: input.dados,
      procedimento,
    });
    expect(repository.atualizar).toHaveBeenCalledWith({
      ...input,
      dados: dadosValidados,
    });
  });

  it('retorna 404 ao atualizar procedimento inexistente no salão', async () => {
    const input: AtualizarProcedimentoInput = {
      id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
      salaoId: 'salao-ana',
      dados: { nome: 'Novo nome' },
    };
    jest.spyOn(repository, 'buscarPorId').mockResolvedValue(undefined);

    await expect(service.atualizar(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.buscarPorId).toHaveBeenCalledWith(input);
    expect(validator.validarAtualizacao).not.toHaveBeenCalled();
    expect(repository.atualizar).not.toHaveBeenCalled();
  });

  it('desativa o procedimento no salão informado', async () => {
    const input: BuscarProcedimentoInput = {
      id: procedimento.id,
      salaoId: procedimento.salao_id,
    };
    jest.spyOn(repository, 'desativar').mockResolvedValue(procedimento);

    expect(await service.desativar(input)).toBe(procedimento);
    expect(repository.desativar).toHaveBeenCalledWith(input);
  });

  it('retorna 404 ao desativar procedimento inexistente no salão', async () => {
    const input: BuscarProcedimentoInput = {
      id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
      salaoId: 'salao-ana',
    };
    jest.spyOn(repository, 'desativar').mockResolvedValue(undefined);

    await expect(service.desativar(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.desativar).toHaveBeenCalledWith(input);
  });
});

function criarProcedimentoPersistido(): ProcedimentoPersistido {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'salao-ana',
    nome: 'Corte',
    descricao: null,
    info_pre_procedimento: null,
    duracao_min: 30,
    preco: '100.00',
    tipo_sinal: 'fixo',
    valor_sinal: '20.00',
    periodo_manutencao_dias: null,
    ativo: true,
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
  };
}
