import { Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentIdentity } from '../auth/decorators/current-identity.decorator';
import type { AuthenticatedIdentity } from '../auth/contracts';
import { UsuarioResponseDto } from './contracts';
import { UsuarioService } from './usuario.service';

@ApiTags('Usu\u00e1rios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria ou recupera a conta global autenticada',
    description:
      'Materializa a conta local a partir do perfil do provedor autenticador.',
  })
  @ApiCreatedResponse({
    description: 'Conta local criada.',
    type: UsuarioResponseDto.Output,
  })
  @ApiOkResponse({
    description:
      'Conta local j\u00e1 materializada para a identidade autenticada.',
    type: UsuarioResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inv\u00e1lido.',
  })
  @ApiConflictResponse({
    description: 'O e-mail verificado j\u00e1 pertence a outra conta global.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Perfil sem nome, sobrenome ou e-mail prim\u00e1rio verificado.',
  })
  async criarOuObterAtual(
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resultado =
      await this.usuarioService.criarOuObterUsuarioAtual(identity);

    response.status(resultado.criado ? HttpStatus.CREATED : HttpStatus.OK);
    return resultado.usuario;
  }

  @Get('eu')
  @ApiOperation({ summary: 'Obt\u00e9m a conta global autenticada' })
  @ApiOkResponse({
    description: 'Conta global da identidade autenticada.',
    type: UsuarioResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inv\u00e1lido.',
  })
  @ApiNotFoundResponse({
    description: 'A conta local ainda n\u00e3o foi criada.',
  })
  buscarAtual(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return this.usuarioService.buscarUsuarioAtual(identity);
  }
}
