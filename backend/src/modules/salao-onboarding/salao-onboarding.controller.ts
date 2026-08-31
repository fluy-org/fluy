import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentIdentity } from '@/modules/auth/decorators/current-identity.decorator';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import {
  CriarSalaoRequestDto,
  SalaoResponseDto,
  SubdominioIndisponivelResponseDto,
} from '@/modules/salao-onboarding/contracts';
import { toSalaoResponse } from '@/modules/salao-onboarding/salao-onboarding.mapper';
import { SalaoService } from '@/modules/salao-onboarding/salao-onboarding.service';

@ApiTags('Salões')
@ApiBearerAuth()
@Controller('saloes')
export class SalaoController {
  constructor(private readonly salaoService: SalaoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria ou recupera o salão da conta autenticada' })
  @ApiCreatedResponse({
    description: 'Salão criado com suas configurações iniciais.',
    type: SalaoResponseDto.Output,
  })
  @ApiOkResponse({
    description: 'Salão já criado para a conta autenticada.',
    type: SalaoResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'A conta global ainda não foi criada.',
  })
  @ApiConflictResponse({
    description: 'Subdomínio indisponível.',
    type: SubdominioIndisponivelResponseDto.Output,
  })
  async criarOuObter(
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Body() input: CriarSalaoRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resultado = await this.salaoService.criarOuObter({
      identity,
      dados: input,
    });

    response.status(resultado.criado ? HttpStatus.CREATED : HttpStatus.OK);
    return toSalaoResponse(resultado.salao);
  }
}
