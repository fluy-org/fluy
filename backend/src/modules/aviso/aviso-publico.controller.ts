import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AvisoResponseDto,
  ListaAvisosResponseDto,
  ListarAvisosPublicosQueryDto,
  ReconhecerAvisoPublicoRequestDto,
} from '@/modules/aviso/contracts';
import {
  toAvisoResponse,
  toListaAvisosResponse,
} from '@/modules/aviso/aviso.mapper';
import { AvisoService } from '@/modules/aviso/aviso.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Avisos públicos')
@Controller('publico/s/:subdominio/avisos')
export class AvisoPublicoController {
  constructor(private readonly avisoService: AvisoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista avisos pendentes da cliente identificada' })
  @ApiOkResponse({ type: ListaAvisosResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Credencial ou cursor inválido.' })
  @ApiNotFoundResponse({ description: 'Sessão da cliente não encontrada.' })
  async listar(
    @TenantFromPath() tenant: TenantContext,
    @Query() query: ListarAvisosPublicosQueryDto,
  ) {
    return toListaAvisosResponse(
      await this.avisoService.listarPublicamente({
        salaoId: tenant.salaoId,
        credencial: query.credencial,
        cursor: query.cursor,
      }),
    );
  }

  @Patch(':id/reconhecer')
  @ApiOperation({ summary: 'Reconhece um aviso da cliente identificada' })
  @ApiOkResponse({ type: AvisoResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Identificador ou credencial inválido.',
  })
  @ApiNotFoundResponse({ description: 'Aviso não encontrado.' })
  async reconhecer(
    @TenantFromPath() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: ReconhecerAvisoPublicoRequestDto,
  ) {
    return toAvisoResponse(
      await this.avisoService.reconhecerPublicamente({
        id,
        salaoId: tenant.salaoId,
        credencial: dados.credencial,
      }),
    );
  }
}
