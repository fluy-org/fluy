import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import type { Request } from 'express';

export type TenantContext = {
  salaoId: string;
  // Nulo na resolução por host: o catálogo público não tem usuário autenticado.
  usuarioSalaoId: string | null;
};

export type TenantRequest = Request & {
  authenticatedIdentity?: AuthenticatedIdentity;
  tenantContext?: TenantContext;
};
