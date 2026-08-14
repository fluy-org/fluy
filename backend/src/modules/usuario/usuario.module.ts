import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsuarioController } from './usuario.controller';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioService } from './usuario.service';

@Module({
  imports: [AuthModule],
  controllers: [UsuarioController],
  providers: [UsuarioRepository, UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
