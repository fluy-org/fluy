import { ForbiddenException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SalaoController } from '@/modules/salao-onboarding/salao-onboarding.controller';
import { SalaoRepository } from '@/modules/salao-onboarding/salao-onboarding.repository';
import { SalaoService } from '@/modules/salao-onboarding/salao-onboarding.service';
import { UsuarioService } from '@/modules/usuario/usuario.service';

describe('proteção HTTP do onboarding do salão', () => {
  let app: INestApplication<App>;
  const criarSalao = jest.fn();
  const usuarioService = {
    buscarUsuarioAtual: jest.fn().mockResolvedValue({
      id: 'a3f828a8-ef5a-4498-aa67-8fc29283cd1a',
      nome: 'Ana',
      sobrenome: 'Silva',
    }),
    verificarAutorizacaoParaCriarSalao: jest
      .fn()
      .mockRejectedValue(new ForbiddenException('sem autorização')),
  };
  const salaoRepository = {
    buscarSalaoDoDono: jest.fn().mockResolvedValue(undefined),
    criar: criarSalao,
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [SalaoController],
      providers: [
        SalaoService,
        { provide: UsuarioService, useValue: usuarioService },
        { provide: SalaoRepository, useValue: salaoRepository },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.use((requisicao, _resposta, proximo) => {
      requisicao.authenticatedIdentity = {
        provider: 'clerk',
        subject: 'user_sem_convite',
      };
      proximo();
    });
    await app.init();
  });

  it('rejeita POST /saloes feito diretamente por conta sem autorização', async () => {
    await request(app.getHttpServer())
      .post('/saloes')
      .send({
        nome: 'Salão sem convite',
        subdominio: 'salao-sem-convite',
        contato_whatsapp: '5511999999999',
        endereco: 'Rua Teste, 1',
        fuso_horario: 'America/Sao_Paulo',
      })
      .expect(403);

    expect(criarSalao).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app.close();
  });
});
