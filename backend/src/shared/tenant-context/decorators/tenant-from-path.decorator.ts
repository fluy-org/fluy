import { criarTenantContextDecorator } from '@/shared/tenant-context/decorators/tenant-context.decorator';

export const TenantFromPath = (): ParameterDecorator =>
  criarTenantContextDecorator({ source: 'path', isPublic: true });
