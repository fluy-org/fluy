import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  SalaoAtualResponseDto,
  SalaoSetupResponseDto,
} from '@/modules/salao/contracts';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import {
  toSalaoAtualResponse,
  toSalaoSetupResponse,
} from '@/modules/salao/salao.mapper';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Salões')
@ApiBearerAuth()
@Controller('saloes')
export class SalaoAtualController {
  constructor(private readonly salaoConsultaService: SalaoConsultaService) {}

  @Get('eu')
  @ApiOperation({ summary: 'Busca o salão da conta autenticada' })
  @ApiOkResponse({
    description: 'Salão vinculado à conta autenticada.',
    type: SalaoAtualResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async buscar(@TenantFromOwner() tenant: TenantContext) {
    return toSalaoAtualResponse(
      await this.salaoConsultaService.buscarPorId(tenant.salaoId),
    );
  }

  @Get('eu/setup')
  @ApiOperation({
    summary: 'Busca o status de configuração do salão autenticado',
  })
  @ApiOkResponse({
    description:
      'Status de configuração do salão vinculado à conta autenticada.',
    type: SalaoSetupResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async buscarSetup(@TenantFromOwner() tenant: TenantContext) {
    return toSalaoSetupResponse(
      await this.salaoConsultaService.buscarSetup(tenant.salaoId),
    );
  }
}
