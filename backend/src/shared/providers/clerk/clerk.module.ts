import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { AUTHENTICATION_PROVIDER } from '@/modules/auth/contracts';
import { DevelopmentAuthenticator } from '@/shared/providers/development/development-authenticator.provider';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';
import { clerkClientProvider } from '@/shared/providers/clerk/clerk-client.provider';

@Global()
@Module({
  providers: [
    clerkClientProvider,
    ClerkAuthenticator,
    DevelopmentAuthenticator,
    {
      provide: AUTHENTICATION_PROVIDER,
      inject: [ConfigService, ClerkAuthenticator, DevelopmentAuthenticator],
      useFactory: (
        config: ConfigService<Env, true>,
        clerkAuthenticator: ClerkAuthenticator,
        developmentAuthenticator: DevelopmentAuthenticator,
      ) =>
        config.get('DEV_AUTH_ENABLED', { infer: true })
          ? developmentAuthenticator
          : clerkAuthenticator,
    },
  ],
  exports: [AUTHENTICATION_PROVIDER],
})
export class ClerkModule {}
