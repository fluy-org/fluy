import { BadRequestException, NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions inspect detached mock functions. */

jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class ClienteService {},
}));

import { AvisoRepository } from '@/modules/aviso/aviso.repository';
import { AvisoService } from '@/modules/aviso/aviso.service';
import type { AvisoPersistido } from '@/modules/aviso/contracts';
import { ClienteService } from '@/modules/cliente/cliente.service';

describe('AvisoService', () => {
  const repository = {
    listarCliente: jest.fn(),
    listarUsuarioSalao: jest.fn(),
    buscarCliente: jest.fn(),
    buscarUsuarioSalao: jest.fn(),
    reconhecerCliente: jest.fn(),
    reconhecerUsuarioSalao: jest.fn(),
    criarParaCliente: jest.fn(),
    criarParaUsuarioSalao: jest.fn(),
    criarParaSalao: jest.fn(),
    possuiUsuarioSalao: jest.fn(),
  } as unknown as AvisoRepository;
  const clienteService = {
    resolverSessaoPublica: jest.fn(),
    buscarPorId: jest.fn(),
  } as unknown as ClienteService;
  const service = new AvisoService(repository, clienteService);

  const avisoPendente = {
    id: 'aviso-1',
    salao_id: 'salao-1',
    cliente_id: 'cliente-1',
    usuario_salao_id: null,
    agendamento_id: null,
    lembrete_id: null,
    tipo: 'agendamento_remarcado',
    titulo: 'Agendamento alterado',
    mensagem: 'Confira o novo horário.',
    criado_em: new Date('2026-10-05T12:00:00.000Z'),
    reconhecido_em: null,
  } satisfies AvisoPersistido;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('resolve a sessão pública e lista somente no salão e cliente corretos', async () => {
    jest.spyOn(clienteService, 'resolverSessaoPublica').mockResolvedValue({
      id: 'cliente-1',
    } as never);
    jest.spyOn(repository, 'listarCliente').mockResolvedValue([]);

    await service.listarPublicamente({
      salaoId: 'salao-1',
      credencial: 'credencial-1',
    });

    expect(clienteService.resolverSessaoPublica).toHaveBeenCalledWith({
      salaoId: 'salao-1',
      credencial: 'credencial-1',
    });
    expect(repository.listarCliente).toHaveBeenCalledWith({
      salaoId: 'salao-1',
      clienteId: 'cliente-1',
      offset: 0,
      limite: 21,
    });
  });

  it('não consulta avisos quando a sessão pública não existe', async () => {
    jest
      .spyOn(clienteService, 'resolverSessaoPublica')
      .mockResolvedValue(undefined);

    await expect(
      service.listarPublicamente({
        salaoId: 'salao-1',
        credencial: 'credencial-invalida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.listarCliente).not.toHaveBeenCalled();
  });

  it('rejeita cursor inválido antes de consultar o banco', async () => {
    await expect(
      service.listarUsuarioSalao({
        salaoId: 'salao-1',
        usuarioSalaoId: 'usuario-1',
        cursor: 'cursor-invalido',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.listarUsuarioSalao).not.toHaveBeenCalled();
  });

  it('não reconhece aviso pertencente a outro destinatário', async () => {
    jest.spyOn(repository, 'buscarCliente').mockResolvedValue(undefined);

    await expect(
      service.reconhecerCliente({
        id: 'aviso-1',
        salaoId: 'salao-1',
        clienteId: 'cliente-2',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.reconhecerCliente).not.toHaveBeenCalled();
  });

  it('mantém o reconhecimento idempotente', async () => {
    const avisoReconhecido = {
      ...avisoPendente,
      reconhecido_em: new Date('2026-10-05T13:00:00.000Z'),
    };
    jest.spyOn(repository, 'buscarCliente').mockResolvedValue(avisoReconhecido);

    const resultado = await service.reconhecerCliente({
      id: 'aviso-1',
      salaoId: 'salao-1',
      clienteId: 'cliente-1',
    });

    expect(resultado).toBe(avisoReconhecido);
    expect(repository.reconhecerCliente).not.toHaveBeenCalled();
  });

  it('valida o cliente no salão antes de criar o aviso', async () => {
    jest.spyOn(clienteService, 'buscarPorId').mockResolvedValue({
      id: 'cliente-1',
    } as never);
    jest.spyOn(repository, 'criarParaCliente').mockResolvedValue(avisoPendente);

    await service.criarParaCliente({
      salaoId: 'salao-1',
      clienteId: 'cliente-1',
      tipo: avisoPendente.tipo,
      titulo: avisoPendente.titulo,
      mensagem: avisoPendente.mensagem,
    });

    expect(clienteService.buscarPorId).toHaveBeenCalledWith({
      id: 'cliente-1',
      salaoId: 'salao-1',
    });
  });

  it('delega a criação do aviso para todos os usuários do salão', async () => {
    jest.spyOn(repository, 'criarParaSalao').mockResolvedValue([]);

    await service.criarParaSalao({
      salaoId: 'salao-1',
      tipo: 'lembrete_vencido',
      titulo: 'Lembrete de Ana',
      mensagem: 'Ligar para Ana.',
      lembreteId: 'lembrete-1',
    });

    expect(repository.criarParaSalao).toHaveBeenCalledWith({
      salaoId: 'salao-1',
      tipo: 'lembrete_vencido',
      titulo: 'Lembrete de Ana',
      mensagem: 'Ligar para Ana.',
      lembreteId: 'lembrete-1',
    });
  });
});
