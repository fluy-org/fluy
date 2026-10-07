import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AvisoResponseDto,
  ListaAvisosResponseDto,
  ListarAvisosQueryDto,
} from '@/modules/aviso/contracts';
import {
  toAvisoResponse,
  toListaAvisosResponse,
} from '@/modules/aviso/aviso.mapper';
import { AvisoService } from '@/modules/aviso/aviso.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Avisos')
@ApiBearerAuth()
@Controller('avisos')
export class AvisoController {
  constructor(private readonly avisoService: AvisoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista avisos pendentes do usuário do salão' })
  @ApiOkResponse({ type: ListaAvisosResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Cursor de paginação inválido.' })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  async listar(
    @TenantFromOwner() tenant: TenantContext,
    @Query() query: ListarAvisosQueryDto,
  ) {
    return toListaAvisosResponse(
      await this.avisoService.listarUsuarioSalao({
        salaoId: tenant.salaoId,
        usuarioSalaoId: tenant.usuarioSalaoId!,
        cursor: query.cursor,
      }),
    );
  }

  @Patch(':id/reconhecer')
  @ApiOperation({ summary: 'Reconhece um aviso do usuário do salão' })
  @ApiOkResponse({ type: AvisoResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Identificador inválido.' })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Aviso não encontrado.' })
  async reconhecer(
    @TenantFromOwner() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return toAvisoResponse(
      await this.avisoService.reconhecerUsuarioSalao({
        id,
        salaoId: tenant.salaoId,
        usuarioSalaoId: tenant.usuarioSalaoId!,
      }),
    );
  }
}
