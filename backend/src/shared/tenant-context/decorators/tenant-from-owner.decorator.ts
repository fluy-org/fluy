import { criarTenantContextDecorator } from '@/shared/tenant-context/decorators/tenant-context.decorator';

export const TenantFromOwner = (): ParameterDecorator =>
  criarTenantContextDecorator({ source: 'owner', isPublic: false });
