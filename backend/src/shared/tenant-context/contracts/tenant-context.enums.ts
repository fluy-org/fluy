export const TENANT_RESOLUTION_SOURCES = ['owner', 'host'] as const;
export type TenantResolutionSource = (typeof TENANT_RESOLUTION_SOURCES)[number];
