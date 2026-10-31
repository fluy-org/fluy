import { envSchema } from '@/config/env.schema';

const envBase = {
  API_PUBLIC_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://fluy:fluy@localhost:5432/fluy',
  STORAGE_ENDPOINT: 'https://storage.fluy.local',
  STORAGE_BUCKET: 'fluy-dev',
  STORAGE_ACCESS_KEY_ID: 'access-key',
  STORAGE_SECRET_ACCESS_KEY: 'secret-key',
  CLERK_SECRET_KEY: 'sk_test_chave',
  CLERK_AUTHORIZED_PARTIES: 'http://localhost:4200',
  CORS_ORIGINS: 'http://localhost:4200',
  TENANT_BASE_DOMAIN: 'localhost',
};

describe('envSchema', () => {
  it('mantém a exigência de convite desabilitada por padrão', () => {
    const resultado = envSchema.safeParse(envBase);

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.OWNER_INVITE_ENFORCEMENT_ENABLED).toBe(false);
    }
  });

  it('aceita habilitar explicitamente a exigência de convite', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      OWNER_INVITE_ENFORCEMENT_ENABLED: 'true',
      OWNER_INVITE_METADATA_SECRET:
        'segredo-de-metadata-com-mais-de-trinta-e-dois-caracteres',
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.OWNER_INVITE_ENFORCEMENT_ENABLED).toBe(true);
    }
  });

  it('rejeita ativação sem o segredo de metadata dos convites', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      OWNER_INVITE_ENFORCEMENT_ENABLED: 'true',
    });

    expect(resultado.success).toBe(false);
  });

  it('valida a configuração operacional dos convites', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      OWNER_INVITE_REDIRECT_URL: 'https://fluy.example/cadastro',
      OWNER_INVITE_DEFAULT_EXPIRATION_DAYS: '10',
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.OWNER_INVITE_REDIRECT_URL).toBe(
        'https://fluy.example/cadastro',
      );
      expect(resultado.data.OWNER_INVITE_DEFAULT_EXPIRATION_DAYS).toBe(10);
    }
  });

  it('mantém sete dias como validade padrão dos convites', () => {
    const resultado = envSchema.safeParse(envBase);

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.OWNER_INVITE_DEFAULT_EXPIRATION_DAYS).toBe(7);
    }
  });

  it('mantém o bypass desabilitado quando recebe false do ambiente', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      DEV_AUTH_ENABLED: 'false',
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.DEV_AUTH_ENABLED).toBe(false);
    }
  });

  it('aceita bypass configurado apenas em desenvolvimento', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      NODE_ENV: 'development',
      DEV_AUTH_ENABLED: 'true',
      DEV_AUTH_TOKEN: 'token-local-com-mais-de-trinta-e-dois-caracteres',
      DEV_AUTH_SUBJECT: 'user_local',
    });

    expect(resultado.success).toBe(true);
  });

  it('rejeita bypass fora de desenvolvimento', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'true',
      DEV_AUTH_TOKEN: 'token-local-com-mais-de-trinta-e-dois-caracteres',
      DEV_AUTH_SUBJECT: 'user_local',
    });

    expect(resultado.success).toBe(false);
  });

  it('exige token e subject quando o bypass está habilitado', () => {
    const resultado = envSchema.safeParse({
      ...envBase,
      NODE_ENV: 'development',
      DEV_AUTH_ENABLED: 'true',
    });

    expect(resultado.success).toBe(false);
  });
});
