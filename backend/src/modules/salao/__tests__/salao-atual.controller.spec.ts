jest.mock('@/modules/salao/contracts', () => ({
  SalaoAtualResponseDto: { Output: class SalaoAtualResponseDto {} },
}));
jest.mock('@/modules/salao/salao.mapper', () => ({
  toSalaoAtualResponse: jest.fn(),
}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class SalaoConsultaService {},
}));

import type { TenantContext } from '@/shared/tenant-context/contracts';
import { SalaoAtualController } from '@/modules/salao/salao-atual.controller';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { toSalaoAtualResponse } from '@/modules/salao/salao.mapper';

describe('SalaoAtualController', () => {
  const buscarPorId = jest.fn();
  const service = { buscarPorId } as unknown as SalaoConsultaService;
  const controller = new SalaoAtualController(service);
  const tenant: TenantContext = {
    salaoId: '00000000-0000-4000-8000-000000000001',
    usuarioSalaoId: '00000000-0000-4000-8000-000000000002',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('busca o salao pelo tenant autenticado e devolve a resposta mapeada', async () => {
    const salao = { id: tenant.salaoId };
    const resposta = { id: tenant.salaoId, subdominio: 'salao-da-ana' };
    buscarPorId.mockResolvedValue(salao);
    jest.mocked(toSalaoAtualResponse).mockReturnValue(resposta as never);

    await expect(controller.buscar(tenant)).resolves.toBe(resposta);
    expect(buscarPorId).toHaveBeenCalledTimes(1);
    expect(buscarPorId).toHaveBeenCalledWith(tenant.salaoId);
    expect(toSalaoAtualResponse).toHaveBeenCalledTimes(1);
    expect(toSalaoAtualResponse).toHaveBeenCalledWith(salao);
  });
});
