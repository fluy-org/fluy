import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SalaoPublicoResponseDto } from '@/modules/salao/contracts';
import { toSalaoPublicoResponse } from '@/modules/salao/salao.mapper';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';

@ApiTags('Página pública do salão')
@Controller('publico/s/:subdominio')
export class SalaoPublicoController {
  constructor(
    private readonly salaoConsultaService: SalaoConsultaService,
    private readonly salaoConfiguracaoService: SalaoConfiguracaoService,
  ) {}

  @Get('salao')
  @ApiOperation({ summary: 'Obtém os dados públicos do salão' })
  @ApiOkResponse({ type: SalaoPublicoResponseDto.Output })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async buscar(@TenantFromPath() tenant: TenantContext) {
    const [salao, configuracao] = await Promise.all([
      this.salaoConsultaService.buscarPorId(tenant.salaoId),
      this.salaoConfiguracaoService.buscar(tenant.salaoId),
    ]);

    return toSalaoPublicoResponse(salao, configuracao);
  }
}
