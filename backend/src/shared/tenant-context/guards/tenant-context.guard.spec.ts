import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { TenantRequest } from '@/shared/tenant-context/contracts';
import { TenantContextResolver } from '@/shared/tenant-context/tenant-context.resolver';
import { TenantContextGuard } from '@/shared/tenant-context/guards/tenant-context.guard';

describe('TenantContextGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const resolver = {
    resolverPorDono: jest.fn(),
    resolverPorHost: jest.fn(),
  } as unknown as TenantContextResolver;
  const guard = new TenantContextGuard(reflector, resolver);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('não resolve tenant em rota sem decorator', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(await guard.canActivate(createContext({} as TenantRequest))).toBe(
      true,
    );
    expect(resolver.resolverPorDono).not.toHaveBeenCalled();
    expect(resolver.resolverPorHost).not.toHaveBeenCalled();
  });

  it('resolve o tenant do dono autenticado', async () => {
    const identity = { provider: 'clerk' as const, subject: 'user_123' };
    const request = { authenticatedIdentity: identity } as TenantRequest;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('owner');
    jest
      .spyOn(resolver, 'resolverPorDono')
      .mockResolvedValue({ salaoId: 'salao-ana' });

    expect(await guard.canActivate(createContext(request))).toBe(true);
    expect(resolver.resolverPorDono).toHaveBeenCalledWith(identity);
    expect(request.tenantContext).toEqual({ salaoId: 'salao-ana' });
  });

  it('resolve o tenant pelo host público', async () => {
    const request = {
      headers: { host: 'ana.localhost:3000' },
    } as TenantRequest;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('host');
    jest
      .spyOn(resolver, 'resolverPorHost')
      .mockResolvedValue({ salaoId: 'salao-ana' });

    expect(await guard.canActivate(createContext(request))).toBe(true);
    expect(resolver.resolverPorHost).toHaveBeenCalledWith('ana.localhost:3000');
    expect(request.tenantContext).toEqual({ salaoId: 'salao-ana' });
  });

  it('retorna 404 quando não encontra tenant', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('host');
    jest.spyOn(resolver, 'resolverPorHost').mockResolvedValue(undefined);

    await esperarNotFound(() =>
      guard.canActivate(
        createContext({
          headers: { host: 'invalido.localhost' },
        } as TenantRequest),
      ),
    );
  });
});

function createContext(request: TenantRequest): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

async function esperarNotFound(acao: () => Promise<unknown>) {
  try {
    await acao();
    throw new Error('A ação deveria rejeitar a requisição.');
  } catch (error) {
    expect(error).toBeInstanceOf(NotFoundException);
  }
}
