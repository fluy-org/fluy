import { Global, Module } from '@nestjs/common';
import { AUTHENTICATION_PROVIDER } from '@/modules/auth/contracts';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';
import { clerkClientProvider } from '@/shared/providers/clerk/clerk-client.provider';

@Global()
@Module({
  providers: [
    clerkClientProvider,
    ClerkAuthenticator,
    {
      provide: AUTHENTICATION_PROVIDER,
      useExisting: ClerkAuthenticator,
    },
  ],
  exports: [AUTHENTICATION_PROVIDER],
})
export class ClerkModule {}
