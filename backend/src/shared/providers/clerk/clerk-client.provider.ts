import { createClerkClient, type ClerkClient } from '@clerk/backend';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';

export const CLERK_CLIENT = Symbol('CLERK_CLIENT');

export const clerkClientProvider: Provider = {
  provide: CLERK_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): ClerkClient =>
    createClerkClient({
      secretKey: config.get('CLERK_SECRET_KEY', { infer: true }),
    }),
};
