import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { NextFunction, Request, Response } from 'express';
import type { Env } from '@/config/env.schema';
import { AuthService } from '@/modules/auth/auth.service';
import { UsuarioController } from '@/modules/usuario/usuario.controller';
import { UsuarioRepository } from '@/modules/usuario/usuario.repository';
import { UsuarioService } from '@/modules/usuario/usuario.service';

describe('proteção HTTP da criação de usuários', () => {
  let app: INestApplication<App>;
  const authService = {
    getProfile: jest.fn().mockResolvedValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: true,
      conviteProprietario: { status: 'ausente' },
    }),
  };
  const usuarioRepository = {
    criarOuObter: jest.fn().mockResolvedValue({ status: 'convite_necessario' }),
  };
  const config = {
    get: jest.fn().mockReturnValue(true),
  } as unknown as ConfigService<Env, true>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [
        UsuarioService,
        { provide: AuthService, useValue: authService },
        { provide: UsuarioRepository, useValue: usuarioRepository },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.use(
      (
        requisicao: Request & { authenticatedIdentity?: unknown },
        _resposta: Response,
        proximo: NextFunction,
      ) => {
        requisicao.authenticatedIdentity = {
          provider: 'clerk',
          subject: 'user_sem_convite',
        };
        proximo();
      },
    );
    await app.init();
  });

  it('rejeita POST /usuarios feito diretamente sem convite', async () => {
    await request(app.getHttpServer()).post('/usuarios').expect(403);

    expect(usuarioRepository.criarOuObter).toHaveBeenCalledWith(
      expect.objectContaining({
        exigirConvite: true,
        referenciaConviteClerk: null,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
