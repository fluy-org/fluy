import { Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentIdentity } from '../auth/decorators/current-identity.decorator';
import type { AuthenticatedIdentity } from '../auth/contracts';
import { UsuarioService } from './usuario.service';

@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  async criarOuObterAtual(
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resultado = await this.usuarioService.criarOuObterUsuarioAtual(identity);

    response.status(resultado.criado ? HttpStatus.CREATED : HttpStatus.OK);
    return resultado.usuario;
  }

  @Get('eu')
  buscarAtual(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return this.usuarioService.buscarUsuarioAtual(identity);
  }
}
