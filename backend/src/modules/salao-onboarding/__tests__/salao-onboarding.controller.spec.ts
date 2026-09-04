jest.mock('@/modules/salao-onboarding/contracts', () => ({
  CriarSalaoRequestDto: class CriarSalaoRequestDto {},
  SalaoResponseDto: { Output: class SalaoResponseDto {} },
  SubdominioIndisponivelResponseDto: {
    Output: class SubdominioIndisponivelResponseDto {},
  },
}));
jest.mock('@/modules/salao-onboarding/salao-onboarding.mapper', () => ({
  toSalaoResponse: jest.fn(),
}));
jest.mock('@/modules/salao-onboarding/salao-onboarding.service', () => ({
  SalaoService: class SalaoService {},
}));

import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import type {
  CriarSalaoRequestDto,
  ResultadoCriarOuObterSalao,
} from '@/modules/salao-onboarding/contracts';
import { toSalaoResponse } from '@/modules/salao-onboarding/salao-onboarding.mapper';
import { SalaoController } from '@/modules/salao-onboarding/salao-onboarding.controller';
import { SalaoService } from '@/modules/salao-onboarding/salao-onboarding.service';

describe('SalaoController', () => {
  const criarOuObter = jest.fn();
  const service = { criarOuObter } as unknown as SalaoService;
  const controller = new SalaoController(service);
  const identity: AuthenticatedIdentity = {
    provider: 'clerk',
    subject: 'user_123',
  };
  const input = {
    nome: 'Salao da Ana',
    subdominio: 'salao-da-ana',
  } as CriarSalaoRequestDto;
  const status = jest.fn();
  const response = { status } as unknown as Response;
  const mapearSalao = jest.mocked(toSalaoResponse);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('retorna 201 e a resposta mapeada quando cria o salao', async () => {
    const resultado = criarResultado(true);
    const resposta = { id: resultado.salao.id, nome: resultado.salao.nome };
    criarOuObter.mockResolvedValue(resultado);
    mapearSalao.mockReturnValue(resposta as never);

    expect(await controller.criarOuObter(identity, input, response)).toBe(
      resposta,
    );
    expect(criarOuObter).toHaveBeenCalledWith({ identity, dados: input });
    expect(status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(mapearSalao).toHaveBeenCalledWith(resultado.salao);
  });

  it('retorna 200 quando o salao ja existia', async () => {
    const resultado = criarResultado(false);
    criarOuObter.mockResolvedValue(resultado);
    mapearSalao.mockReturnValue({} as never);

    await controller.criarOuObter(identity, input, response);

    expect(status).toHaveBeenCalledWith(HttpStatus.OK);
  });
});

function criarResultado(criado: boolean): ResultadoCriarOuObterSalao {
  return {
    criado,
    salao: {
      id: 'salao-ana',
      nome: 'Salao da Ana',
      subdominio: 'salao-da-ana',
      contato_whatsapp: '5511999999999',
      endereco: 'Rua das Flores, 1',
      fuso_horario: 'America/Sao_Paulo',
      criado_em: new Date('2026-01-01T00:00:00.000Z'),
    } as ResultadoCriarOuObterSalao['salao'],
  };
}
