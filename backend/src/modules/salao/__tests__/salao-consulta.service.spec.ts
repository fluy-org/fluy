import { NotFoundException } from '@nestjs/common';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { SalaoRepository } from '@/modules/salao/salao.repository';

describe('SalaoConsultaService', () => {
  const buscarPorId = jest.fn();
  const buscarSetup = jest.fn();
  const repository = {
    buscarPorId,
    buscarSetup,
  } as unknown as SalaoRepository;
  const service = new SalaoConsultaService(repository);
  const salaoId = '00000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarSetup', () => {
    it('devolve o setup quando o salao existe', async () => {
      const setup = {
        temProcedimentoAtivo: true,
        temDisponibilidade: true,
        temPix: false,
        subdominio: 'salao-teste',
      };
      buscarSetup.mockResolvedValue(setup);

      await expect(service.buscarSetup(salaoId)).resolves.toEqual(setup);
      expect(buscarSetup).toHaveBeenCalledWith(salaoId);
    });

    it('lanca NotFoundException quando o salao nao e encontrado', async () => {
      buscarSetup.mockResolvedValue(undefined);

      await expect(service.buscarSetup(salaoId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
