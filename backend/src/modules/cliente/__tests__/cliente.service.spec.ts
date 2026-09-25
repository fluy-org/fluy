import { BadRequestException, NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

jest.mock('@fluy/schema', () => ({}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class SalaoConsultaService {},
}));

import { codificarCursorPagina } from '@/modules/cliente/cliente-utils';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import { ClienteService } from '@/modules/cliente/cliente.service';
import type {
  ClienteDaListaPersistido,
  ClienteFichaPersistido,
  ListarClienteInput,
} from '@/modules/cliente/contracts';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

describe('ClienteService', () => {
  const repository = {
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarFicha: jest.fn(),
    possuiCliente: jest.fn(),
    listarAgendamentos: jest.fn(),
  } as unknown as ClienteRepository;
  const salaoConsultaService = {
    obterFusoHorario: jest.fn(),
  } as unknown as SalaoConsultaService;
  const service = new ClienteService(repository, salaoConsultaService);
  const filtros: ListarClienteInput = {
    salaoId: 'salao-ana',
    status: 'ativos',
    segmento: 'todas',
    ordenacao: 'nome',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(salaoConsultaService, 'obterFusoHorario')
      .mockResolvedValue('America/Sao_Paulo');
  });

  describe('listar', () => {
    it('consulta a primeira página no salão informado', async () => {
      jest.spyOn(repository, 'listar').mockResolvedValue([]);

      const resultado = await service.listar(filtros);

      expect(salaoConsultaService.obterFusoHorario).toHaveBeenCalledWith(
        'salao-ana',
      );
      expect(repository.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          salaoId: 'salao-ana',
          offset: 0,
          limite: 21,
        }),
      );
      expect(resultado).toEqual({
        fusoHorario: 'America/Sao_Paulo',
        itens: [],
        proximoCursor: null,
      });
    });

    it('calcula a janela recente trinta dias antes do instante atual', async () => {
      jest.spyOn(repository, 'listar').mockResolvedValue([]);

      await service.listar(filtros);

      const [{ agora, janelaRecenteDesde }] = jest.mocked(repository.listar)
        .mock.calls[0];
      expect(agora.getTime() - janelaRecenteDesde.getTime()).toBe(
        30 * 86_400_000,
      );
    });

    it('devolve cursor da próxima página quando há mais itens', async () => {
      const linhas = Array.from(
        { length: 21 },
        (_, indice) =>
          ({ id: `cliente-${indice}` }) as ClienteDaListaPersistido,
      );
      jest.spyOn(repository, 'listar').mockResolvedValue(linhas);

      const resultado = await service.listar({
        ...filtros,
        cursor: codificarCursorPagina({ offset: 20 }),
      });

      expect(repository.listar).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20 }),
      );
      expect(resultado.itens).toHaveLength(20);
      expect(resultado.proximoCursor).toBe(
        codificarCursorPagina({ offset: 40 }),
      );
    });

    it('rejeita cursor inválido sem consultar o banco', async () => {
      await expect(
        service.listar({ ...filtros, cursor: 'nao-e-um-cursor' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.listar).not.toHaveBeenCalled();
    });
  });

  describe('buscarFicha', () => {
    it('busca a ficha no salão informado', async () => {
      const ficha = {
        cliente: { id: 'cliente-ana' },
      } as ClienteFichaPersistido;
      jest.spyOn(repository, 'buscarFicha').mockResolvedValue(ficha);

      const resultado = await service.buscarFicha({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
      });

      expect(repository.buscarFicha).toHaveBeenCalledWith({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
      });
      expect(resultado).toEqual({ ...ficha, fusoHorario: 'America/Sao_Paulo' });
    });

    it('retorna 404 para cliente fora do salão', async () => {
      jest.spyOn(repository, 'buscarFicha').mockResolvedValue(undefined);

      await expect(
        service.buscarFicha({ id: 'cliente-bia', salaoId: 'salao-ana' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listarAgendamentos', () => {
    it('lista o histórico do cliente no salão informado', async () => {
      jest.spyOn(repository, 'possuiCliente').mockResolvedValue(true);
      jest.spyOn(repository, 'listarAgendamentos').mockResolvedValue([]);

      await service.listarAgendamentos({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
      });

      expect(repository.possuiCliente).toHaveBeenCalledWith({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
      });
      expect(repository.listarAgendamentos).toHaveBeenCalledWith({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
        offset: 0,
        limite: 21,
      });
    });

    it('retorna 404 sem listar quando o cliente não é do salão', async () => {
      jest.spyOn(repository, 'possuiCliente').mockResolvedValue(false);

      await expect(
        service.listarAgendamentos({ id: 'cliente-bia', salaoId: 'salao-ana' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.listarAgendamentos).not.toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    it('continua retornando 404 quando o repository não encontra cliente ativo', async () => {
      jest.spyOn(repository, 'buscarPorId').mockResolvedValue(undefined);

      await expect(
        service.buscarPorId({ id: 'cliente-inativa', salaoId: 'salao-ana' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
