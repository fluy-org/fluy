import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuario/usuario.module';
import { SalaoController } from './salao-onboarding.controller';
import { SalaoRepository } from './salao-onboarding.repository';
import { SalaoService } from './salao-onboarding.service';

@Module({
  imports: [UsuarioModule],
  controllers: [SalaoController],
  providers: [SalaoRepository, SalaoService],
})
export class SalaoOnboardingModule {}
