import type { StatusCobrancaGateway } from '@fluy/schema';

export const STATUS_COBRANCA_ATIVOS = [
  'iniciando',
  'pendente',
] as const satisfies readonly StatusCobrancaGateway[];
