import type { AuthenticatedIdentity } from '../../../modules/auth/contracts';
import type { Request } from 'express';

export type TenantContext = {
  salaoId: string;
};

export type TenantRequest = Request & {
  authenticatedIdentity?: AuthenticatedIdentity;
  tenantContext?: TenantContext;
};
