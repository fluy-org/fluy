import { envSchema } from '@/config/env.schema';

const ambiente = {
  API_PUBLIC_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://localhost/test',
  STORAGE_ENDPOINT: 'http://localhost:9000',
  STORAGE_BUCKET: 'test',
  STORAGE_ACCESS_KEY_ID: 'test',
  STORAGE_SECRET_ACCESS_KEY: 'test',
  CLERK_SECRET_KEY: 'test',
  CLERK_AUTHORIZED_PARTIES: 'http://localhost:8100',
  CORS_ORIGINS: 'http://localhost:8100',
  TENANT_BASE_DOMAIN: 'localhost',
};

describe('configuração do provedor de pagamentos', () => {
  it('aceita o provedor fake apenas em desenvolvimento', () => {
    expect(
      envSchema.safeParse({
        ...ambiente,
        NODE_ENV: 'development',
        PAYMENT_PROVIDER: 'fake',
      }).success,
    ).toBe(true);
    expect(
      envSchema.safeParse({
        ...ambiente,
        NODE_ENV: 'production',
        PAYMENT_PROVIDER: 'fake',
      }).success,
    ).toBe(false);
    expect(
      envSchema.safeParse({
        ...ambiente,
        NODE_ENV: 'test',
        PAYMENT_PROVIDER: 'fake',
      }).success,
    ).toBe(false);
  });

  it('deixa pagamentos desabilitados por padrão', () => {
    const resultado = envSchema.parse(ambiente);
    expect(resultado.PAYMENT_PROVIDER).toBe('disabled');
  });
});
