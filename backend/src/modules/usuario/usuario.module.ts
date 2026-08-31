import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsuarioController } from '@/modules/usuario/usuario.controller';
import { UsuarioRepository } from '@/modules/usuario/usuario.repository';
import { UsuarioService } from '@/modules/usuario/usuario.service';

@Module({
  imports: [AuthModule],
  controllers: [UsuarioController],
  providers: [UsuarioRepository, UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
