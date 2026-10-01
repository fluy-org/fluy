import { BadRequestException, NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

jest.mock('@fluy/schema', () => ({}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class SalaoConsultaService {},
}));
jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class ClienteService {},
}));

import type { ClienteService } from '@/modules/cliente/cliente.service';
import type { NotaRepository } from '@/modules/nota/nota.repository';
import { NotaService } from '@/modules/nota/nota.service';
import type { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { codificarCursorPagina } from '@/shared/paginacao/paginacao.utils';

describe('NotaService', () => {
  const repository = {
    listar: jest.fn(),
    possuiAgendamentoDaCliente: jest.fn(),
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn(),
  } as unknown as NotaRepository;
  const clienteService = {
    buscarPorId: jest.fn(),
  } as unknown as ClienteService;
  const salaoConsultaService = {
    obterFusoHorario: jest.fn(),
  } as unknown as SalaoConsultaService;
  const service = new NotaService(
    repository,
    clienteService,
    salaoConsultaService,
  );
  const dados = {
    cliente_id: 'cliente-ana',
    texto: 'Prefere café sem açúcar.',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(salaoConsultaService, 'obterFusoHorario')
      .mockResolvedValue('America/Sao_Paulo');
    jest
      .spyOn(clienteService, 'buscarPorId')
      .mockResolvedValue({ id: 'cliente-ana' } as never);
    jest.spyOn(repository, 'listar').mockResolvedValue([]);
    jest
      .spyOn(repository, 'criar')
      .mockResolvedValue({ id: 'nota-ana' } as never);
  });

  describe('listar', () => {
    it('consulta a primeira página no salão informado', async () => {
      const resultado = await service.listar({
        salaoId: 'salao-ana',
        clienteId: 'cliente-ana',
      });

      expect(repository.listar).toHaveBeenCalledWith({
        salaoId: 'salao-ana',
        clienteId: 'cliente-ana',
        offset: 0,
        limite: 21,
      });
      expect(resultado).toEqual({
        fusoHorario: 'America/Sao_Paulo',
        itens: [],
        proximoCursor: null,
      });
    });

    it('continua a partir do offset do cursor', async () => {
      await service.listar({
        salaoId: 'salao-ana',
        clienteId: 'cliente-ana',
        cursor: codificarCursorPagina({ offset: 20 }),
      });

      expect(repository.listar).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20 }),
      );
    });

    it('recusa cursor inválido', async () => {
      await expect(
        service.listar({ salaoId: 'salao-ana', cursor: 'invalido' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.listar).not.toHaveBeenCalled();
    });
  });

  describe('criar', () => {
    it('recusa cliente fora do salão ou inativa', async () => {
      jest
        .spyOn(clienteService, 'buscarPorId')
        .mockRejectedValue(new NotFoundException('Cliente não encontrado.'));

      await expect(
        service.criar({
          dados,
          salaoId: 'salao-ana',
          usuarioSalaoId: 'usuario-salao-ana',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(clienteService.buscarPorId).toHaveBeenCalledWith({
        id: 'cliente-ana',
        salaoId: 'salao-ana',
      });
      expect(repository.criar).not.toHaveBeenCalled();
    });

    it('recusa agendamento de outro salão ou de outra cliente', async () => {
      jest
        .spyOn(repository, 'possuiAgendamentoDaCliente')
        .mockResolvedValue(false);

      await expect(
        service.criar({
          dados: { ...dados, agendamento_id: 'agendamento-bia' },
          salaoId: 'salao-ana',
          usuarioSalaoId: 'usuario-salao-ana',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.possuiAgendamentoDaCliente).toHaveBeenCalledWith({
        agendamentoId: 'agendamento-bia',
        clienteId: 'cliente-ana',
        salaoId: 'salao-ana',
      });
      expect(repository.criar).not.toHaveBeenCalled();
    });

    it('registra a nota com o usuário do salão como autor', async () => {
      jest
        .spyOn(repository, 'possuiAgendamentoDaCliente')
        .mockResolvedValue(true);

      await service.criar({
        dados: { ...dados, agendamento_id: 'agendamento-ana' },
        salaoId: 'salao-ana',
        usuarioSalaoId: 'usuario-salao-ana',
      });

      expect(repository.criar).toHaveBeenCalledWith({
        dados: { ...dados, agendamento_id: 'agendamento-ana' },
        autorId: 'usuario-salao-ana',
      });
    });

    it('recusa criar sem usuário do salão identificado', async () => {
      await expect(
        service.criar({ dados, salaoId: 'salao-ana', usuarioSalaoId: null }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.criar).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('não encontra nota de outro salão ou de cliente inativa', async () => {
      jest.spyOn(repository, 'atualizar').mockResolvedValue(undefined);

      await expect(
        service.atualizar({
          id: 'nota-bia',
          salaoId: 'salao-ana',
          dados: { texto: 'Novo texto.' },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.atualizar).toHaveBeenCalledWith({
        id: 'nota-bia',
        salaoId: 'salao-ana',
        dados: { texto: 'Novo texto.' },
      });
    });
  });

  describe('remover', () => {
    it('não encontra nota de outro salão ou de cliente inativa', async () => {
      jest.spyOn(repository, 'buscarPorId').mockResolvedValue(undefined);

      await expect(
        service.remover({ id: 'nota-bia', salaoId: 'salao-ana' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remover).not.toHaveBeenCalled();
    });

    it('exclui a nota encontrada no salão', async () => {
      jest
        .spyOn(repository, 'buscarPorId')
        .mockResolvedValue({ id: 'nota-ana' } as never);

      await service.remover({ id: 'nota-ana', salaoId: 'salao-ana' });

      expect(repository.remover).toHaveBeenCalledWith({
        id: 'nota-ana',
        salaoId: 'salao-ana',
      });
    });
  });
});
