import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuario/usuario.module';
import { SalaoController } from './salao.controller';
import { SalaoRepository } from './salao.repository';
import { SalaoService } from './salao.service';

@Module({
  imports: [UsuarioModule],
  controllers: [SalaoController],
  providers: [SalaoRepository, SalaoService],
})
export class SalaoModule {}
