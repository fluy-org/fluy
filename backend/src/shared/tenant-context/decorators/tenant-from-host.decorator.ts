import { criarTenantContextDecorator } from './tenant-context.decorator';

export const TenantFromHost = (): ParameterDecorator =>
  criarTenantContextDecorator({ source: 'host', isPublic: true });
