import type { salao } from '@fluy/schema';

export type SalaoConsultado = Pick<
  typeof salao.$inferSelect,
  | 'id'
  | 'nome'
  | 'subdominio'
  | 'contato_whatsapp'
  | 'endereco'
  | 'fuso_horario'
>;
