import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

jest.mock('@fluy/schema', () => ({}));

import { AuthService } from '../auth/auth.service';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  const authService = {
    getProfile: jest.fn(),
  } as unknown as AuthService;
  const usuarioRepository = {
    criarOuObter: jest.fn(),
    buscarPorIdentidade: jest.fn(),
  } as unknown as UsuarioRepository;
  const service = new UsuarioService(authService, usuarioRepository);
  const identity = { provider: 'clerk' as const, subject: 'user_123' };
  const usuario = {
    id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana@example.com',
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
  };
  const usuarioResponse = {
    ...usuario,
    criado_em: usuario.criado_em.toISOString(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('cria a conta local com perfil Clerk verificado', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: true,
    });
    jest.spyOn(usuarioRepository, 'criarOuObter').mockResolvedValue({
      status: 'criado',
      usuario,
    });

    const resultado = await service.criarOuObterUsuarioAtual(identity);

    expect(resultado).toEqual({
      criado: true,
      usuario: usuarioResponse,
    });
  });

  it('reutiliza a conta já materializada', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: true,
    });
    jest.spyOn(usuarioRepository, 'criarOuObter').mockResolvedValue({
      status: 'existente',
      usuario,
    });

    const resultado = await service.criarOuObterUsuarioAtual(identity);

    expect(resultado).toEqual({
      criado: false,
      usuario: usuarioResponse,
    });
  });

  it('rejeita perfil sem e-mail verificado', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: false,
    });

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      UnprocessableEntityException,
    );
  });

  it('rejeita perfil sem nome ou sobrenome', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue({
      nome: 'Ana',
      sobrenome: null,
      email: 'ana@example.com',
      emailVerified: true,
    });

    await esperarErro(
      () => service.criarOuObterUsuarioAtual(identity),
      UnprocessableEntityException,
    );
  });

  it('rejeita identidade nova associada a e-mail existente', async () => {
    jest.spyOn(authService, 'getProfile').mockResolvedValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: true,
    });
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
      () => service.buscarUsuarioAtual(identity),
      NotFoundException,
    );
  });
});

async function esperarErro(
  acao: () => Promise<unknown>,
  tipoErro: new (...args: any[]) => Error,
) {
  try {
    await acao();
    throw new Error('A aÃ§Ã£o deveria falhar.');
  } catch (error) {
    expect(error).toBeInstanceOf(tipoErro);
  }
}
