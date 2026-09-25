import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';
import type {
  TenantContext,
  TenantRequest,
} from '@/shared/tenant-context/contracts';
import { TENANT_RESOLUTION_SOURCE_KEY } from '@/shared/tenant-context/decorators/tenant-context.decorator';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';
import { TenantContextGuard } from '@/shared/tenant-context/guards/tenant-context.guard';
import type { TenantContextResolver } from '@/shared/tenant-context/tenant-context.resolver';

describe('tenant pelo path público', () => {
  it('marca o handler como público e resolvido pelo path', () => {
    const handler = PathController.prototype.listar;

    expect(Reflect.getMetadata(TENANT_RESOLUTION_SOURCE_KEY, handler)).toBe(
      'path',
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });

  it('usa o subdomínio da rota para resolver o tenant', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('path'),
    } as unknown as Reflector;
    const resolver = {
      resolverPorSubdominio: jest.fn().mockResolvedValue({
        salaoId: 'salao-ana',
        usuarioSalaoId: null,
      }),
    } as unknown as TenantContextResolver;
    const request = {
      params: { subdominio: 'salao-da-ana' },
    } as unknown as TenantRequest;
    const guard = new TenantContextGuard(reflector, resolver);

    expect(await guard.canActivate(criarContexto(request))).toBe(true);
    expect(resolver.resolverPorSubdominio).toHaveBeenCalledWith(
      'salao-da-ana',
    );
    expect(request.tenantContext?.salaoId).toBe('salao-ana');
  });
});

class PathController {
  listar(@TenantFromPath() _tenant: TenantContext): void {}
}

function criarContexto(request: TenantRequest): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}
