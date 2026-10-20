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
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import { RecebimentoPixService } from '@/modules/salao-configuracao/recebimento-pix.service';
import {
  AtualizarRecebimentoPixRequestDto,
  RecebimentoPixResponseDto,
} from '@/modules/salao-configuracao/contracts';
import { toRecebimentoPixResponse } from '@/modules/salao-configuracao/recebimento-pix.mapper';

@ApiTags('Recebimento Pix')
@ApiBearerAuth()
@Controller('salao/configuracao/recebimento-pix')
export class RecebimentoPixController {
  constructor(private readonly service: RecebimentoPixService) {}

  @Get()
  @ApiOperation({ summary: 'Busca os dados de recebimento Pix do salão atual' })
  @ApiOkResponse({ type: RecebimentoPixResponseDto.Output })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Recebimento Pix não cadastrado.' })
  async buscar(@TenantFromOwner() tenant: TenantContext) {
    return toRecebimentoPixResponse(await this.service.buscar(tenant.salaoId));
  }

  @Put()
  @ApiOperation({
    summary: 'Atualiza os dados de recebimento Pix do salão atual',
  })
  @ApiOkResponse({ type: RecebimentoPixResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Dados de recebimento Pix inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Configuração do salão não encontrada.' })
  async atualizar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarRecebimentoPixRequestDto,
  ) {
    return toRecebimentoPixResponse(
      await this.service.atualizar({ salaoId: tenant.salaoId, dados }),
    );
  }
}
