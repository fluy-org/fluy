import { criarTenantContextDecorator } from '@/shared/tenant-context/decorators/tenant-context.decorator';

export const TenantFromHost = (): ParameterDecorator =>
  criarTenantContextDecorator({ source: 'host', isPublic: true });
