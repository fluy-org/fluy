import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromHost } from '@/shared/tenant-context/decorators/tenant-from-host.decorator';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import { TENANT_RESOLUTION_SOURCE_KEY } from '@/shared/tenant-context/decorators/tenant-context.decorator';

describe('decorators de tenant context', () => {
  it('marca rota do dono sem torná-la pública', () => {
    const handler = OwnerController.prototype.listar;

    expect(Reflect.getMetadata(TENANT_RESOLUTION_SOURCE_KEY, handler)).toBe(
      'owner',
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('marca rota de host como pública', () => {
    const handler = HostController.prototype.listar;

    expect(Reflect.getMetadata(TENANT_RESOLUTION_SOURCE_KEY, handler)).toBe(
      'host',
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });
});

class OwnerController {
  listar(@TenantFromOwner() _tenant: TenantContext): void {}
}

class HostController {
  listar(@TenantFromHost() _tenant: TenantContext): void {}
}
