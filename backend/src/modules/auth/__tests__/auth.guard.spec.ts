import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';

describe('AuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const authService = {
    authenticate: jest.fn(),
  } as unknown as AuthService;
  const guard = new AuthGuard(reflector, authService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('permite rota pública sem token', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);

    const resultado = await guard.canActivate(createContext({} as Request));

    expect(resultado).toBe(true);
    expect(authService.authenticate).not.toHaveBeenCalled();
  });

  it('rejeita request sem Bearer token', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(false);

    await esperarUnauthorized(() =>
      guard.canActivate(createContext({ headers: {} } as Request)),
    );
  });

  it('anexa a identidade validada à request', async () => {
    const request = {
      headers: { authorization: 'Bearer token-clerk' },
    } as Request & { authenticatedIdentity?: unknown };

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(false);
    jest.spyOn(authService, 'authenticate').mockResolvedValue({
      provider: 'clerk',
      subject: 'user_123',
    });

    const resultado = await guard.canActivate(createContext(request));

    expect(resultado).toBe(true);
    expect(authService.authenticate).toHaveBeenCalledWith('token-clerk');
    expect(request.authenticatedIdentity).toEqual({
      provider: 'clerk',
      subject: 'user_123',
    });
  });
});

function createContext(request: Request): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

async function esperarUnauthorized(acao: () => Promise<unknown>) {
  try {
    await acao();
    throw new Error('A aÃ§Ã£o deveria rejeitar a requisiÃ§Ã£o.');
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
  }
}
