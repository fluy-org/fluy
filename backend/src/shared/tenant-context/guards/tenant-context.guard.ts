import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  type TenantContext,
  type TenantRequest,
  type TenantResolutionSource,
} from '@/shared/tenant-context/contracts';
import { TENANT_RESOLUTION_SOURCE_KEY } from '@/shared/tenant-context/decorators/tenant-context.decorator';
import { TenantContextResolver } from '@/shared/tenant-context/tenant-context.resolver';

type ResolverTenantInput = {
  request: TenantRequest;
  source: TenantResolutionSource;
};

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextResolver: TenantContextResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const source = this.reflector.getAllAndOverride<TenantResolutionSource>(
      TENANT_RESOLUTION_SOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!source) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const tenant = await this.resolverTenant({ request, source });

    if (!tenant) {
      throw new NotFoundException('Salão não encontrado.');
    }

    request.tenantContext = tenant;
    return true;
  }

  private async resolverTenant({
    request,
    source,
  }: ResolverTenantInput): Promise<TenantContext | undefined> {
    if (source === 'host') {
      return this.tenantContextResolver.resolverPorHost(
        request.headers.host ?? '',
      );
    }

    if (source === 'path') {
      const subdominio = request.params.subdominio;

      if (typeof subdominio !== 'string') {
        return undefined;
      }

      return this.tenantContextResolver.resolverPorSubdominio(
        subdominio,
      );
    }

    const identity = request.authenticatedIdentity;

    if (!identity) {
      return undefined;
    }

    return this.tenantContextResolver.resolverPorDono(identity);
  }
}
