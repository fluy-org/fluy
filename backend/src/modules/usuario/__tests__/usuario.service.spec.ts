import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

jest.mock('@fluy/schema', () => ({}));

import type { Env } from '@/config/env.schema';
import { AuthService } from '@/modules/auth/auth.service';
import { criarEvidenciaConviteProprietario } from '@/modules/auth/owner-invitation-evidence';
import { UsuarioRepository } from '@/modules/usuario/usuario.repository';
import { UsuarioService } from '@/modules/usuario/usuario.service';

const segredo = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

describe('UsuarioService', () => {
  const authService = {
    getProfile: jest.fn(),
  } as unknown as AuthService;
  const usuarioRepository = {
    criarOuObter: jest.fn(),
    buscarPorIdentidade: jest.fn(),
    possuiVinculoSalao: jest.fn(),
    possuiAutorizacaoProprietario: jest.fn(),
  } as unknown as UsuarioRepository;
  const config = {
    get: jest.fn(),
  } as unknown as ConfigService<Env, true>;
  const service = new UsuarioService(authService, usuarioRepository, config);
  const identity = { provider: 'clerk' as const, subject: 'user_123' };
  const usuario = {
    id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana@example.com',
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(config, 'get').mockImplementation((key: keyof Env) => {
      if (key === 'OWNER_INVITE_METADATA_SECRET') {
        return segredo;
      }
      return false;
    });
  });

  it('cria a conta local com perfil Clerk verificado', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue(criarPerfil());
    const criarOuObter = jest
      .spyOn(usuarioRepository, 'criarOuObter')
      .mockResolvedValue({
        status: 'criado',
        usuario,
      });

    const resultado = await service.criarOuObterUsuarioAtual(identity);

    expect(resultado).toEqual({ criado: true, usuario });
    expect(criarOuObter).toHaveBeenCalledWith(
      expect.objectContaining({
        exigirConvite: false,
        referenciaConviteClerk: null,
      }),
    );
  });

  it('reutiliza a conta já materializada', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue(criarPerfil());
    jest.spyOn(usuarioRepository, 'criarOuObter').mockResolvedValue({
      status: 'existente',
      usuario,
    });

    expect(await service.criarOuObterUsuarioAtual(identity)).toEqual({
      criado: false,
      usuario,
    });
  });

  it('rejeita perfil sem e-mail verificado', async () => {
    jest
      .spyOn(authService, 'getProfile')
      .mockResolvedValue(criarPerfil({ emailVerified: false }));

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      UnprocessableEntityException,
    );
  });

  it('rejeita perfil sem nome ou sobrenome', async () => {
    jest
      .spyOn(authService, 'getProfile')
      .mockResolvedValue(criarPerfil({ sobrenome: null }));

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      UnprocessableEntityException,
    );
  });

  it('rejeita identidade nova associada a e-mail existente', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue(criarPerfil());
    jest.spyOn(usuarioRepository, 'criarOuObter').mockResolvedValue({
      status: 'email_em_uso',
    });

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      ConflictException,
    );
  });

  it('informa quando a conta local ainda não existe', async () => {
    jest
      .spyOn(usuarioRepository, 'buscarPorIdentidade')
      .mockResolvedValue(undefined);

    await esperarErro(
      () => service.buscarEstadoAtual(identity),
      NotFoundException,
    );
  });

  it('informa conta sem salão', async () => {
    jest
      .spyOn(usuarioRepository, 'buscarPorIdentidade')
      .mockResolvedValue(usuario);
    jest
      .spyOn(usuarioRepository, 'possuiVinculoSalao')
      .mockResolvedValue(false);

    expect(await service.buscarEstadoAtual(identity)).toEqual({
      usuario,
      estado: 'sem-salao',
    });
  });

  it('informa conta com salão', async () => {
    jest
      .spyOn(usuarioRepository, 'buscarPorIdentidade')
      .mockResolvedValue(usuario);
    jest.spyOn(usuarioRepository, 'possuiVinculoSalao').mockResolvedValue(true);

    expect(await service.buscarEstadoAtual(identity)).toEqual({
      usuario,
      estado: 'com-salao',
    });
  });

  it('rejeita conta nova sem convite quando a proteção está habilitada', async () => {
    jest.spyOn(config, 'get').mockReturnValue(true);
    jest.spyOn(authService, 'getProfile').mockResolvedValue(criarPerfil());
    const criarOuObter = jest
      .spyOn(usuarioRepository, 'criarOuObter')
      .mockResolvedValue({
        status: 'convite_necessario',
      });

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      ForbiddenException,
    );
    expect(criarOuObter).toHaveBeenCalledWith(
      expect.objectContaining({
        exigirConvite: true,
        referenciaConviteClerk: null,
      }),
    );
  });

  it('rejeita evidência de convite já materializada por outra conta', async () => {
    jest
      .spyOn(config, 'get')
      .mockImplementation((key: keyof Env) =>
        key === 'OWNER_INVITE_METADATA_SECRET' ? segredo : true,
      );
    jest
      .spyOn(authService, 'getProfile')
      .mockResolvedValue(
        criarPerfil({ conviteProprietario: criarMetadataValida() }),
      );
    jest.spyOn(usuarioRepository, 'criarOuObter').mockResolvedValue({
      status: 'convite_consumido',
    });

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      ForbiddenException,
    );
  });

  it('rejeita metadata de proprietário ausente ou malformada', async () => {
    jest
      .spyOn(authService, 'getProfile')
      .mockResolvedValue(
        criarPerfil({ conviteProprietario: { status: 'invalida' } }),
      );

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      ForbiddenException,
    );
    expect(
      jest.spyOn(usuarioRepository, 'criarOuObter'),
    ).not.toHaveBeenCalled();
  });

  it('rejeita evidência assinada para outro e-mail', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue(
      criarPerfil({
        conviteProprietario: criarMetadataValida('outra@example.com'),
      }),
    );

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      ForbiddenException,
    );
    expect(
      jest.spyOn(usuarioRepository, 'criarOuObter'),
    ).not.toHaveBeenCalled();
  });

  it('mantém válida uma autorização legada existente após ativar a proteção', async () => {
    jest.spyOn(config, 'get').mockReturnValue(true);
    jest
      .spyOn(usuarioRepository, 'possuiAutorizacaoProprietario')
      .mockResolvedValue(true);

    await expect(
      service.verificarAutorizacaoParaCriarSalao(usuario.id),
    ).resolves.toBeUndefined();
  });

  it('rejeita chamada direta para criar salão sem autorização', async () => {
    jest.spyOn(config, 'get').mockReturnValue(true);
    jest
      .spyOn(usuarioRepository, 'possuiAutorizacaoProprietario')
      .mockResolvedValue(false);

    await esperarErro(
      () => service.verificarAutorizacaoParaCriarSalao(usuario.id),
      ForbiddenException,
    );
  });

  it('bloqueia criação de salão sem autorização mesmo durante a transição', async () => {
    jest.spyOn(config, 'get').mockReturnValue(false);
    const possuiAutorizacao = jest
      .spyOn(usuarioRepository, 'possuiAutorizacaoProprietario')
      .mockResolvedValue(false);

    await esperarErro(
      () => service.verificarAutorizacaoParaCriarSalao(usuario.id),
      ForbiddenException,
    );
    expect(possuiAutorizacao).toHaveBeenCalledWith(usuario.id);
  });
});

function criarPerfil(
  input: Partial<{
    nome: string | null;
    sobrenome: string | null;
    email: string | null;
    emailVerified: boolean;
    conviteProprietario:
      | ReturnType<typeof criarMetadataValida>
      | {
          status: 'ausente';
        }
      | { status: 'invalida' };
  }> = {},
) {
  return {
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana@example.com',
    emailVerified: true,
    conviteProprietario: { status: 'ausente' as const },
    ...input,
  };
}

function criarMetadataValida(email = 'ana@example.com') {
  return {
    status: 'valida' as const,
    evidencia: criarEvidenciaConviteProprietario({
      email,
      referencia: '7d5c96a7-c33a-4e76-8ae8-f57558577e53',
      segredo,
    }),
  };
}

async function esperarErro(
  acao: () => Promise<unknown>,
  tipoErro: new (...args: any[]) => Error,
) {
  try {
    await acao();
    throw new Error('A ação deveria falhar.');
  } catch (error) {
    expect(error).toBeInstanceOf(tipoErro);
  }
}
