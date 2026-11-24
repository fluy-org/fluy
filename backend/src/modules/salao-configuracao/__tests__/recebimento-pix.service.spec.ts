import { NotFoundException } from '@nestjs/common';
import { RecebimentoPixService } from '@/modules/salao-configuracao/recebimento-pix.service';

describe('RecebimentoPixService', () => {
  const repository = {
    buscar: jest.fn(),
    atualizar: jest.fn(),
  };
  const service = new RecebimentoPixService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('normaliza e atualiza apenas o salão informado', async () => {
    repository.atualizar.mockResolvedValue({
      salao_id: 'salao-a',
      pix_tipo_chave: 'email',
      pix_chave: 'salon@example.com',
      pix_nome_recebedor: 'Salão A',
    });

    await service.atualizar({
      salaoId: 'salao-a',
      dados: {
        tipo_chave: 'email',
        chave: '  SALON@EXAMPLE.COM  ',
        nome_recebedor: '  Salão A  ',
      },
    });

    expect(repository.atualizar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      dados: {
        tipo_chave: 'email',
        chave: 'salon@example.com',
        nome_recebedor: 'Salão A',
      },
    });
  });

  it('não inventa cadastro quando o salão não existe', async () => {
    repository.buscar.mockResolvedValue(undefined);
    await expect(service.buscar('salao-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('recusa cadastro Pix incompleto antes de montar a resposta', async () => {
    repository.buscar.mockResolvedValue({
      pix_tipo_chave: 'email',
      pix_chave: 'salao@example.com',
      pix_nome_recebedor: null,
      pix_atualizado_em: null,
    });
    await expect(service.buscar('salao-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('verificarPagamentoOnlineDisponivel', () => {
    it('retorna false quando PAYMENT_PROVIDER está disabled', async () => {
      const config = { get: jest.fn().mockReturnValue('disabled') };
      const servicoComConfig = new RecebimentoPixService(
        repository as never,
        config as never,
      );

      const resultado = await servicoComConfig.verificarPagamentoOnlineDisponivel('salao-a');
      expect(resultado).toBe(false);
      expect(repository.buscar).not.toHaveBeenCalled();
    });

    it('retorna false quando provedor ativo mas pix incompleto', async () => {
      const config = { get: jest.fn().mockReturnValue('efi') };
      const servicoComConfig = new RecebimentoPixService(
        repository as never,
        config as never,
      );
      repository.buscar.mockResolvedValue({
        pix_tipo_chave: 'email',
        pix_chave: 'salao@example.com',
        pix_nome_recebedor: null,
        pix_atualizado_em: null,
      });

      const resultado = await servicoComConfig.verificarPagamentoOnlineDisponivel('salao-a');
      expect(resultado).toBe(false);
    });

    it('retorna true quando provedor ativo e pix completo', async () => {
      const config = { get: jest.fn().mockReturnValue('efi') };
      const servicoComConfig = new RecebimentoPixService(
        repository as never,
        config as never,
      );
      repository.buscar.mockResolvedValue({
        pix_tipo_chave: 'email',
        pix_chave: 'salao@example.com',
        pix_nome_recebedor: 'Salão Completo',
        pix_atualizado_em: new Date(),
      });

      const resultado = await servicoComConfig.verificarPagamentoOnlineDisponivel('salao-a');
      expect(resultado).toBe(true);
    });
  });
});
