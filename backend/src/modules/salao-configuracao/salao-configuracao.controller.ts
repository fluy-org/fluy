import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TenantContext } from '../../shared/tenant-context/contracts';
import { TenantFromOwner } from '../../shared/tenant-context/decorators/tenant-from-owner.decorator';
import {
  AtualizarSalaoConfiguracaoRequestDto,
  SalaoConfiguracaoResponseDto,
} from './contracts';
import { toSalaoConfiguracaoResponse } from './salao-configuracao.mapper';
import { SalaoConfiguracaoService } from './salao-configuracao.service';

@ApiTags('Configuração do salão')
@ApiBearerAuth()
@Controller('salao/configuracao')
export class SalaoConfiguracaoController {
  constructor(
    private readonly salaoConfiguracaoService: SalaoConfiguracaoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Busca a configuração do salão atual' })
  @ApiOkResponse({
    description: 'Configuração do salão.',
    type: SalaoConfiguracaoResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão ou configuração não encontrada.' })
  async buscar(@TenantFromOwner() tenant: TenantContext) {
    return toSalaoConfiguracaoResponse(
      await this.salaoConfiguracaoService.buscar(tenant.salaoId),
    );
  }

  @Put()
  @ApiOperation({ summary: 'Atualiza parcialmente a configuração do salão' })
  @ApiOkResponse({
    description: 'Configuração do salão atualizada.',
    type: SalaoConfiguracaoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Dados da configuração inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão ou configuração não encontrada.' })
  async atualizar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarSalaoConfiguracaoRequestDto,
  ) {
    return toSalaoConfiguracaoResponse(
      await this.salaoConfiguracaoService.atualizar({
        dados,
        salaoId: tenant.salaoId,
      }),
    );
  }
}
