import {
  BadRequestException,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { AllExceptionsFilter } from '@/shared/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
  const filter = new AllExceptionsFilter(logger);

  beforeEach(() => jest.clearAllMocks());

  it('mantém o envelope e propaga o request id', () => {
    const { host, status, json } = criarContexto({
      id: 'meu-request-id-customizado',
    });

    filter.catch(new NotFoundException('Recurso não encontrado'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      messages: ['Recurso não encontrado'],
      requestId: 'meu-request-id-customizado',
    });
  });

  it('normaliza uma mensagem HTTP em array', () => {
    const { host, json } = criarContexto();

    filter.catch(new BadRequestException('Entrada inválida'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      messages: ['Entrada inválida'],
    });
  });

  it('mapeia todas as issues do Zod com o caminho do campo', () => {
    const resultado = z
      .object({
        name: z.string().trim().min(1, 'Nome obrigatório'),
        cover_ref: z.string().max(10, 'Referência muito longa'),
      })
      .strict()
      .safeParse({
        name: '   ',
        cover_ref: 'x'.repeat(20),
        campo_hackeado: true,
      });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;

    const { host, json } = criarContexto();
    filter.catch(new ZodValidationException(resultado.error), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        messages: expect.arrayContaining([
          'name: Nome obrigatório',
          'cover_ref: Referência muito longa',
        ]),
      }),
    );
    expect(
      (json.mock.calls[0]?.[0] as { messages: string[] }).messages.some(
        (message) => message.includes('campo_hackeado'),
      ),
    ).toBe(true);
  });

  it('não registra respostas esperadas de cliente como erro interno', () => {
    const { host } = criarContexto();

    filter.catch(new BadRequestException('Entrada inválida'), host);

    expect(logger.error).not.toHaveBeenCalled();
  });
});

function criarContexto(requestOverrides: Partial<Request> = {}): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status, json } as unknown as Response;
  const request = {
    method: 'GET',
    url: '/recurso',
    ...requestOverrides,
  } as Request;

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;

  return { host, status, json };
}
