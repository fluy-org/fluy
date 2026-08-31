import { NotFoundException } from '@nestjs/common';

jest.mock('@fluy/schema', () => ({}), { virtual: true });

import type {
  AtualizarSalaoConfiguracaoInput,
  SalaoConfiguracaoPersistida,
} from '@/modules/salao-configuracao/contracts';
import { SalaoConfiguracaoRepository } from '@/modules/salao-configuracao/salao-configuracao.repository';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';
import { SalaoConfiguracaoValidator } from '@/modules/salao-configuracao/salao-configuracao.validator';

describe('SalaoConfiguracaoService', () => {
  const buscarPorSalaoId = jest.fn();
  const atualizar = jest.fn();
  const repository = {
    buscarPorSalaoId,
    atualizar,
  } as unknown as SalaoConfiguracaoRepository;
  const validarAtualizacao = jest.fn();
  const validator = {
    validarAtualizacao,
  } as unknown as SalaoConfiguracaoValidator;
  const service = new SalaoConfiguracaoService(repository, validator);
  const configuracao = criarConfiguracaoPersistida();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('busca a configuração pelo salão informado', async () => {
    buscarPorSalaoId.mockResolvedValue(configuracao);

    expect(await service.buscar('salao-ana')).toBe(configuracao);
    expect(buscarPorSalaoId).toHaveBeenCalledWith('salao-ana');
  });

  it('retorna 404 quando a configuração do salão não existe', async () => {
    buscarPorSalaoId.mockResolvedValue(undefined);

    await esperarNotFound(() => service.buscar('salao-ana'));
  });

  it('atualiza a configuração do salão informado', async () => {
    const input: AtualizarSalaoConfiguracaoInput = {
      dados: { tolerancia_atraso_min: 20 },
      salaoId: configuracao.salao_id,
    };
    const configuracaoAtualizada = criarConfiguracaoPersistida({
      tolerancia_atraso_min: 20,
    });
    buscarPorSalaoId.mockResolvedValue(configuracao);
    validarAtualizacao.mockReturnValue(input.dados);
    atualizar.mockResolvedValue(configuracaoAtualizada);

    expect(await service.atualizar(input)).toBe(configuracaoAtualizada);
    expect(buscarPorSalaoId).toHaveBeenCalledWith(input.salaoId);
    expect(validarAtualizacao).toHaveBeenCalledWith({
      configuracao,
      dados: input.dados,
    });
    expect(atualizar).toHaveBeenCalledWith({
      ...input,
      dados: input.dados,
    });
  });

  it('retorna 404 quando a configuração é removida antes da atualização', async () => {
    const input: AtualizarSalaoConfiguracaoInput = {
      dados: { tolerancia_atraso_min: 20 },
      salaoId: configuracao.salao_id,
    };
    buscarPorSalaoId.mockResolvedValue(configuracao);
    validarAtualizacao.mockReturnValue(input.dados);
    atualizar.mockResolvedValue(undefined);

    await esperarNotFound(() => service.atualizar(input));
    expect(atualizar).toHaveBeenCalledWith({
      ...input,
      dados: input.dados,
    });
  });
});

function criarConfiguracaoPersistida(
  input: Partial<SalaoConfiguracaoPersistida> = {},
): SalaoConfiguracaoPersistida {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    granularidade_min: 30,
    prazo_reserva_min: 15,
    tolerancia_atraso_min: 15,
    antecedencia_min_horas: 2,
    antecedencia_max_dias: 60,
    mensagem_confirmacao: null,
    politica_atraso: null,
    ...input,
  };
}

async function esperarNotFound(acao: () => Promise<unknown>) {
  try {
    await acao();
    throw new Error('A ação deveria rejeitar a requisição.');
  } catch (error) {
    expect(error).toBeInstanceOf(NotFoundException);
  }
}
