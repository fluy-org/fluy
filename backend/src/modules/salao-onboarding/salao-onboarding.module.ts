import { Module } from '@nestjs/common';
import { UsuarioModule } from '@/modules/usuario/usuario.module';
import { SalaoController } from '@/modules/salao-onboarding/salao-onboarding.controller';
import { SalaoRepository } from '@/modules/salao-onboarding/salao-onboarding.repository';
import { SalaoService } from '@/modules/salao-onboarding/salao-onboarding.service';

@Module({
  imports: [UsuarioModule],
  controllers: [SalaoController],
  providers: [SalaoRepository, SalaoService],
})
export class SalaoOnboardingModule {}
