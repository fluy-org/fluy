export const TIPO_SESSAO_CLIENTE = ['uuid_dispositivo'] as const;
export type TipoSessaoCliente = (typeof TIPO_SESSAO_CLIENTE)[number];
