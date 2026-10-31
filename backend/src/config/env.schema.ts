import { z } from 'zod';

const originsSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()).min(1));

const booleanEnvSchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PUBLIC_URL: z.string().url(),

    DATABASE_URL: z.string().url(),

    STORAGE_ENDPOINT: z.string().url(),
    STORAGE_BUCKET: z.string().trim().min(1),
    STORAGE_ACCESS_KEY_ID: z.string().min(1),
    STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
    STORAGE_REGION: z.string().trim().min(1).default('auto'),

    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_AUTHORIZED_PARTIES: originsSchema,
    OWNER_INVITE_REDIRECT_URL: z.string().url().optional(),
    OWNER_INVITE_METADATA_SECRET: z.string().min(32).optional(),
    OWNER_INVITE_DEFAULT_EXPIRATION_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(30)
      .default(7),
    OWNER_INVITE_ENFORCEMENT_ENABLED: booleanEnvSchema.default(false),
    DEV_AUTH_ENABLED: booleanEnvSchema.default(false),
    DEV_AUTH_TOKEN: z.string().min(32).optional(),
    DEV_AUTH_SUBJECT: z.string().trim().min(1).optional(),
    PAYMENT_PROVIDER: z.enum(['disabled', 'fake', 'efi']).default('disabled'),
    EFI_ENVIRONMENT: z.literal('homologation').default('homologation'),
    EFI_CLIENT_ID: z.string().min(1).optional(),
    EFI_CLIENT_SECRET: z.string().min(1).optional(),
    EFI_CERTIFICATE_PATH: z.string().min(1).optional(),
    EFI_CERTIFICATE_PASSPHRASE: z.string().default(''),
    EFI_WEBHOOK_SECRET: z
      .string()
      .min(32)
      .max(128)
      .regex(/^[a-zA-Z0-9]+$/)
      .optional(),
    CORS_ORIGINS: originsSchema,
    TENANT_BASE_DOMAIN: z.string().trim().min(1).toLowerCase(),

    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  })
  .superRefine((env, context) => {
    if (env.PAYMENT_PROVIDER === 'fake' && env.NODE_ENV !== 'development') {
      context.addIssue({
        code: 'custom',
        path: ['PAYMENT_PROVIDER'],
        message: 'O provedor fake só pode ser usado em desenvolvimento.',
      });
    }

    if (
      env.OWNER_INVITE_ENFORCEMENT_ENABLED &&
      !env.OWNER_INVITE_METADATA_SECRET
    ) {
      context.addIssue({
        code: 'custom',
        path: ['OWNER_INVITE_METADATA_SECRET'],
        message:
          'OWNER_INVITE_METADATA_SECRET é obrigatório quando OWNER_INVITE_ENFORCEMENT_ENABLED=true.',
      });
    }

    if (env.PAYMENT_PROVIDER === 'efi') {
      if (env.NODE_ENV === 'production') {
        context.addIssue({
          code: 'custom',
          path: ['PAYMENT_PROVIDER'],
          message: 'Efí disponível somente para homologação.',
        });
      }
      for (const key of [
        'EFI_CLIENT_ID',
        'EFI_CLIENT_SECRET',
        'EFI_CERTIFICATE_PATH',
        'EFI_WEBHOOK_SECRET',
      ] as const) {
        if (!env[key])
          context.addIssue({
            code: 'custom',
            path: [key],
            message: 'Configuração obrigatória para Efí.',
          });
      }
    }
    if (!env.DEV_AUTH_ENABLED) {
      return;
    }

    if (env.NODE_ENV !== 'development') {
      context.addIssue({
        code: 'custom',
        path: ['DEV_AUTH_ENABLED'],
        message: 'DEV_AUTH_ENABLED só pode ser usado em desenvolvimento.',
      });
    }

    if (!env.DEV_AUTH_TOKEN) {
      context.addIssue({
        code: 'custom',
        path: ['DEV_AUTH_TOKEN'],
        message: 'DEV_AUTH_TOKEN é obrigatório quando DEV_AUTH_ENABLED=true.',
      });
    }
    if (!env.DEV_AUTH_SUBJECT) {
      context.addIssue({
        code: 'custom',
        path: ['DEV_AUTH_SUBJECT'],
        message: 'DEV_AUTH_SUBJECT é obrigatório quando DEV_AUTH_ENABLED=true.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
