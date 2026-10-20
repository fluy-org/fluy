import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { ConviteProprietarioModule } from '@/modules/convite-proprietario/convite-proprietario.module';

@Module({
  imports: [ConfigModule, ConviteProprietarioModule],
})
export class ConviteProprietarioCommandModule {}
