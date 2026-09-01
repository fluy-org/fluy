import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantContextRepository } from '@/shared/tenant-context/tenant-context.repository';

@Injectable()
export class TenantContextResolver {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly tenantContextRepository: TenantContextRepository,
  ) {}

  resolverPorDono(
    identity: AuthenticatedIdentity,
  ): Promise<TenantContext | undefined> {
    return this.tenantContextRepository.buscarPorDono(identity);
  }

  async resolverPorHost(host: string): Promise<TenantContext | undefined> {
    const subdominio = this.extrairSubdominio(host);

    if (!subdominio) {
      return undefined;
    }

    return this.tenantContextRepository.buscarPorSubdominio(subdominio);
  }

  private extrairSubdominio(host: string): string | undefined {
    const dominioBase = this.config.get('TENANT_BASE_DOMAIN', {
      infer: true,
    });
    const hostNormalizado = host.toLowerCase().replace(/:\d+$/, '');
    const sufixo = `.${dominioBase}`;

    if (!hostNormalizado.endsWith(sufixo)) {
      return undefined;
    }

    const subdominio = hostNormalizado.slice(0, -sufixo.length);

    if (!subdominio || subdominio.includes('.')) {
      return undefined;
    }

    return subdominio;
  }
}
