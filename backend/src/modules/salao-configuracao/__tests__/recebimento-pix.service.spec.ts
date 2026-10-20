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
});
