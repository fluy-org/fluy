export const ORIGEM_LEMBRETE = ['automatica', 'manual'] as const;
export type OrigemLembrete = (typeof ORIGEM_LEMBRETE)[number];

export const STATUS_LEMBRETE = ['ativo', 'concluido'] as const;
export type StatusLembrete = (typeof STATUS_LEMBRETE)[number];
