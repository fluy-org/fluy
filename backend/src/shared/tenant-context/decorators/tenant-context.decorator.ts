import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';
import type {
  TenantContext,
  TenantRequest,
  TenantResolutionSource,
} from '@/shared/tenant-context/contracts';

export const TENANT_RESOLUTION_SOURCE_KEY = 'tenantResolutionSource';

const tenantContextParameterDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    return request.tenantContext!;
  },
);

export function criarTenantContextDecorator({
  source,
  isPublic,
}: {
  source: TenantResolutionSource;
  isPublic: boolean;
}): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (!propertyKey) {
      throw new Error('Tenant context só pode ser usado em métodos.');
    }

    const handler = (target as Record<string | symbol, unknown>)[propertyKey];

    if (typeof handler !== 'function') {
      throw new Error('Tenant context exige um método de controller.');
    }

    Reflect.defineMetadata(TENANT_RESOLUTION_SOURCE_KEY, source, handler);

    if (isPublic) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
    }

    tenantContextParameterDecorator()(target, propertyKey, parameterIndex);
  };
}
