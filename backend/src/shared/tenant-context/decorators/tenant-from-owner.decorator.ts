import { criarTenantContextDecorator } from './tenant-context.decorator';

export const TenantFromOwner = (): ParameterDecorator =>
  criarTenantContextDecorator({ source: 'owner', isPublic: false });
