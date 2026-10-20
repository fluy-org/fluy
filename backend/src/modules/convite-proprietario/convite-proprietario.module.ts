import { Module } from '@nestjs/common';
import { ConviteProprietarioService } from '@/modules/convite-proprietario/convite-proprietario.service';
import { ClerkApplicationInvitationModule } from '@/shared/providers/clerk/clerk-application-invitation.module';

@Module({
  imports: [ClerkApplicationInvitationModule],
  providers: [ConviteProprietarioService],
  exports: [ConviteProprietarioService],
})
export class ConviteProprietarioModule {}
