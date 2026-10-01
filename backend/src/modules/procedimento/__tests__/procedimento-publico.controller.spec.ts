jest.mock('@/modules/procedimento/procedimento.mapper', () => ({
  toProcedimentoPublicoResponse: jest.fn(),
}));

jest.mock('@/modules/procedimento/procedimento.service', () => ({
  ProcedimentoService: class ProcedimentoService {},
}));

import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type { ProcedimentoService } from '@/modules/procedimento/procedimento.service';
import { ProcedimentoPublicoController } from '@/modules/procedimento/procedimento-publico.controller';
import { toProcedimentoPublicoResponse } from '@/modules/procedimento/procedimento.mapper';

describe('ProcedimentoPublicoController', () => {
  const listarAtivos = jest.fn();
  const service = { listarAtivos } as unknown as ProcedimentoService;
  const config = {
    get: jest.fn().mockReturnValue('https://api.fluy.test'),
  } as unknown as ConfigService<Env, true>;
  const controller = new ProcedimentoPublicoController(service, config);

  beforeEach(() => jest.clearAllMocks());

  it('lista o catálogo somente para o salão resolvido no path', async () => {
    const procedimento = { id: 'procedimento-1' };
    const resposta = { id: 'procedimento-1', nome: 'Corte' };
    listarAtivos.mockResolvedValue([procedimento]);
    jest.mocked(toProcedimentoPublicoResponse).mockReturnValue(resposta as never);

    await expect(
      controller.listarPorSubdominio({
        salaoId: 'salao-do-path',
        usuarioSalaoId: null,
      }),
    ).resolves.toEqual([resposta]);

    expect(listarAtivos).toHaveBeenCalledWith('salao-do-path');
    expect(toProcedimentoPublicoResponse).toHaveBeenCalledWith({
      procedimento,
      apiPublicUrl: 'https://api.fluy.test',
    });
  });
});
