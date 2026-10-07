import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

jest.mock('@fluy/schema', () => ({}));
jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class SalaoConsultaService {},
}));
jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class ClienteService {},
}));
jest.mock('@/modules/lembrete/lembrete-notificacao.service', () => ({
  LembreteNotificacaoService: class LembreteNotificacaoService {},
}));

import type { ClienteService } from '@/modules/cliente/cliente.service';
import type { LembreteComClientePersistido } from '@/modules/lembrete/contracts';
import type { LembreteRepository } from '@/modules/lembrete/lembrete.repository';
import { LembreteService } from '@/modules/lembrete/lembrete.service';
import type { LembreteNotificacaoService } from '@/modules/lembrete/lembrete-notificacao.service';
import type { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

describe('LembreteService', () => {
  const repository = {
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    possuiAgendamentoDaCliente: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    concluir: jest.fn(),
    remover: jest.fn(),
  } as unknown as LembreteRepository;
  const clienteService = {
    buscarPorId: jest.fn(),
  } as unknown as ClienteService;
  const salaoConsultaService = {
    obterFusoHorario: jest.fn(),
  } as unknown as SalaoConsultaService;
  const processarVencidosDoSalao = jest.fn();
  const service = new LembreteService(
    repository,
    clienteService,
    salaoConsultaService,
    { processarVencidosDoSalao } as unknown as LembreteNotificacaoService,
  );
  const escopo = { id: 'lembrete-ana', salaoId: 'salao-ana' };
  const dados = {
    cliente_id: 'cliente-ana',
    texto: 'Ligar para oferecer hidratação.',
    data_alvo: '2026-06-20',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(salaoConsultaService, 'obterFusoHorario')
      .mockResolvedValue('America/Sao_Paulo');
    jest.spyOn(repository, 'listar').mockResolvedValue([]);
    jest.spyOn(repository, 'buscarPorId').mockResolvedValue(criarLembrete());
    jest
      .spyOn(clienteService, 'buscarPorId')
      .mockResolvedValue({ id: 'cliente-ana', nome: 'Ana' } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listar', () => {
    it('resolve a janela a partir de hoje no fuso do salão', async () => {
      // 23h30 de 09/06 em São Paulo já é 10/06 em UTC.
      jest.useFakeTimers({ now: new Date('2026-06-10T02:30:00.000Z') });

      await service.listar({ salaoId: 'salao-ana', periodo: 'hoje' });

      expect(repository.listar).toHaveBeenCalledWith({
        salaoId: 'salao-ana',
        janela: { inicio: '2026-06-09', fim: '2026-06-09' },
        offset: 0,
        limite: 21,
      });
    });

    it('recusa cursor inválido', async () => {
      await expect(
        service.listar({ salaoId: 'salao-ana', cursor: 'invalido' }),
      ).rejects.toBeInstanceOf(BadRequestException);
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

    it('cria com o autor e devolve a cliente junto', async () => {
      jest
        .spyOn(repository, 'criar')
        .mockResolvedValue({ id: 'lembrete-ana' } as never);

      await expect(
        service.criar({
          dados,
          salaoId: 'salao-ana',
          usuarioSalaoId: 'usuario-salao-ana',
        }),
      ).resolves.toEqual({
        id: 'lembrete-ana',
        cliente: { id: 'cliente-ana', nome: 'Ana' },
      });
      expect(repository.criar).toHaveBeenCalledWith({
        dados,
        autorId: 'usuario-salao-ana',
      });
      expect(processarVencidosDoSalao).toHaveBeenCalledWith('salao-ana');
    });
  });

  describe.each([
    [
      'atualizar',
      () => service.atualizar({ ...escopo, dados: { texto: 'Novo texto.' } }),
    ],
    ['concluir', () => service.concluir(escopo)],
    ['remover', () => service.remover(escopo)],
  ])('%s', (_nome, executar) => {
    it('não encontra lembrete de outro salão', async () => {
      jest.spyOn(repository, 'buscarPorId').mockResolvedValue(undefined);

      await expect(executar()).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.buscarPorId).toHaveBeenCalledWith(escopo);
      expect(repository.atualizar).not.toHaveBeenCalled();
      expect(repository.concluir).not.toHaveBeenCalled();
      expect(repository.remover).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('reinicia a notificação quando a data alvo muda', async () => {
      jest.spyOn(repository, 'atualizar').mockResolvedValue({
        id: 'lembrete-ana',
        data_alvo: '2026-06-21',
      } as never);

      await service.atualizar({
        ...escopo,
        dados: { data_alvo: '2026-06-21' },
      });

      expect(repository.atualizar).toHaveBeenCalledWith({
        ...escopo,
        dados: { data_alvo: '2026-06-21' },
        reiniciarNotificacao: true,
      });
    });

    it('mantém a notificação ao alterar somente o texto', async () => {
      jest.spyOn(repository, 'atualizar').mockResolvedValue({
        id: 'lembrete-ana',
        data_alvo: '2026-06-20',
      } as never);

      await service.atualizar({
        ...escopo,
        dados: { texto: 'Novo texto.' },
      });

      expect(repository.atualizar).toHaveBeenCalledWith({
        ...escopo,
        dados: { texto: 'Novo texto.' },
        reiniciarNotificacao: false,
      });
    });
  });

  describe.each([
    [
      'atualizar',
      () => service.atualizar({ ...escopo, dados: { texto: 'Novo texto.' } }),
    ],
    ['concluir', () => service.concluir(escopo)],
  ])('%s', (_nome, executar) => {
    it('recusa lembrete já concluído', async () => {
      jest
        .spyOn(repository, 'buscarPorId')
        .mockResolvedValue(criarLembrete({ status: 'concluido' }));

      await expect(executar()).rejects.toBeInstanceOf(ConflictException);
    });

    it('devolve conflito quando outra requisição concluiu primeiro', async () => {
      jest.spyOn(repository, 'atualizar').mockResolvedValue(undefined);
      jest.spyOn(repository, 'concluir').mockResolvedValue(undefined);

      await expect(executar()).rejects.toBeInstanceOf(ConflictException);
    });
  });

  it('conclui gravando o instante e mantendo a cliente', async () => {
    jest.useFakeTimers({ now: new Date('2026-06-10T15:00:00.000Z') });
    jest
      .spyOn(repository, 'concluir')
      .mockResolvedValue({ id: 'lembrete-ana', status: 'concluido' } as never);

    await expect(service.concluir(escopo)).resolves.toEqual({
      id: 'lembrete-ana',
      status: 'concluido',
      cliente: { id: 'cliente-ana', nome: 'Ana' },
    });
    expect(repository.concluir).toHaveBeenCalledWith({
      ...escopo,
      concluidoEm: new Date('2026-06-10T15:00:00.000Z'),
    });
  });
});

function criarLembrete(
  sobrescritas: Partial<LembreteComClientePersistido> = {},
): LembreteComClientePersistido {
  return {
    id: 'lembrete-ana',
    status: 'ativo',
    data_alvo: '2026-06-20',
    cliente: { id: 'cliente-ana', nome: 'Ana' },
    ...sobrescritas,
  } as LembreteComClientePersistido;
}
