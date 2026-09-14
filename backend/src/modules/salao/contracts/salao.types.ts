import type { salao } from '@fluy/schema';

export type SalaoConsultado = Pick<
  typeof salao.$inferSelect,
  'id' | 'fuso_horario'
>;
