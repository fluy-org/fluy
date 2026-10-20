import { Module } from '@nestjs/common';
import { ClerkApplicationInvitationProvider } from '@/shared/providers/clerk/clerk-application-invitation.provider';
import { clerkClientProvider } from '@/shared/providers/clerk/clerk-client.provider';
import { APPLICATION_INVITATION_PROVIDER } from '@/shared/providers/clerk/contracts';

@Module({
  providers: [
    clerkClientProvider,
    ClerkApplicationInvitationProvider,
    {
      provide: APPLICATION_INVITATION_PROVIDER,
      useExisting: ClerkApplicationInvitationProvider,
    },
  ],
  exports: [APPLICATION_INVITATION_PROVIDER],
})
export class ClerkApplicationInvitationModule {}
