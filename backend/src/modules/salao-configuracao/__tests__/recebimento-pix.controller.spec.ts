import { RecebimentoPixController } from '@/modules/salao-configuracao/recebimento-pix.controller';

describe('RecebimentoPixController', () => {
  const service = { buscar: jest.fn(), atualizar: jest.fn() };
  const controller = new RecebimentoPixController(service as never);
  const tenant = { salaoId: 'salao-a' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('limita leitura e alteração ao salão do dono', async () => {
    service.buscar.mockResolvedValue({
      pix_tipo_chave: 'email',
      pix_chave: 'salon@example.com',
      pix_nome_recebedor: 'Salão A',
      pix_atualizado_em: new Date('2030-01-01'),
    });
    const resposta = await controller.buscar(tenant);
    expect(service.buscar).toHaveBeenCalledWith('salao-a');
    expect(resposta.chave).toBe('salon@example.com');

    const dados = {
      tipo_chave: 'email' as const,
      chave: 'salon@example.com',
      nome_recebedor: 'Salão A',
    };
    service.atualizar.mockResolvedValue({
      pix_tipo_chave: dados.tipo_chave,
      pix_chave: dados.chave,
      pix_nome_recebedor: dados.nome_recebedor,
      pix_atualizado_em: new Date('2030-01-01'),
    });
    await controller.atualizar(tenant, dados);
    expect(service.atualizar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      dados,
    });
  });
});
