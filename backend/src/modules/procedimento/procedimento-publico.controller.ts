import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromHost } from '@/shared/tenant-context/decorators/tenant-from-host.decorator';
import { ProcedimentoPublicoResponseDto } from '@/modules/procedimento/contracts';
import { toProcedimentoPublicoResponse } from '@/modules/procedimento/procedimento.mapper';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';

@ApiTags('Catálogo público')
@Controller('publico/procedimentos')
export class ProcedimentoPublicoController {
  constructor(private readonly procedimentoService: ProcedimentoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista o catálogo público do salão' })
  @ApiOkResponse({
    description:
      'Procedimentos ativos ordenados por criação, do mais antigo ao mais novo.',
    type: [ProcedimentoPublicoResponseDto.Output],
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async listar(@TenantFromHost() tenant: TenantContext) {
    const procedimentos = await this.procedimentoService.listarAtivos(
      tenant.salaoId,
    );

    return procedimentos.map(toProcedimentoPublicoResponse);
  }
}
