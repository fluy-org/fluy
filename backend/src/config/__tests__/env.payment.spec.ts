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

describe('configuração Efí', () => {
  const efi = {
    ...ambiente,
    PAYMENT_PROVIDER: 'efi',
    EFI_CLIENT_ID: 'client',
    EFI_CLIENT_SECRET: 'secret',
    EFI_CERTIFICATE_PATH: '/certificates/test.p12',
    EFI_WEBHOOK_SECRET: 'a'.repeat(64),
  };

  it('permite homologação por padrão e de forma explícita', () => {
    const defaultParsed = envSchema.safeParse(efi);
    expect(defaultParsed.success).toBe(true);
    if (defaultParsed.success) {
      expect(defaultParsed.data.EFI_ENVIRONMENT).toBe('homologation');
    }

    const explicitHomolog = envSchema.safeParse({
      ...efi,
      EFI_ENVIRONMENT: 'homologation',
    });
    expect(explicitHomolog.success).toBe(true);
  });

  it('permite produção e habilita PAYMENT_PROVIDER=efi em NODE_ENV=production', () => {
    const producao = envSchema.safeParse({
      ...efi,
      NODE_ENV: 'production',
      EFI_ENVIRONMENT: 'production',
    });
    expect(producao.success).toBe(true);
    if (producao.success) {
      expect(producao.data.EFI_ENVIRONMENT).toBe('production');
      expect(producao.data.PAYMENT_PROVIDER).toBe('efi');
    }
  });

  it('rejeita ambiente inválido para EFI_ENVIRONMENT', () => {
    expect(
      envSchema.safeParse({
        ...efi,
        EFI_ENVIRONMENT: 'sandbox',
      }).success,
    ).toBe(false);

    expect(
      envSchema.safeParse({
        ...efi,
        EFI_ENVIRONMENT: 'invalid',
      }).success,
    ).toBe(false);
  });

  it('exige credenciais obrigatórias tanto em homologação quanto em produção', () => {
    const chavesObrigatorias = [
      'EFI_CLIENT_ID',
      'EFI_CLIENT_SECRET',
      'EFI_CERTIFICATE_PATH',
      'EFI_WEBHOOK_SECRET',
    ] as const;

    for (const key of chavesObrigatorias) {
      // Falha em homologação
      expect(
        envSchema.safeParse({
          ...efi,
          EFI_ENVIRONMENT: 'homologation',
          [key]: undefined,
        }).success,
      ).toBe(false);

      // Falha em produção
      expect(
        envSchema.safeParse({
          ...efi,
          NODE_ENV: 'production',
          EFI_ENVIRONMENT: 'production',
          [key]: undefined,
        }).success,
      ).toBe(false);
    }
  });
});
