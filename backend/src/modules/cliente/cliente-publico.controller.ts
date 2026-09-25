import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConsultarSessaoClienteQueryDto,
  IdentificarClientePublicaRequestDto,
  SessaoClientePublicaResponseDto,
} from '@/modules/cliente/contracts';
import { toSessaoClientePublicaResponse } from '@/modules/cliente/cliente.mapper';
import { ClienteService } from '@/modules/cliente/cliente.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Cliente público')
@Controller('publico/s/:subdominio/cliente')
export class ClientePublicoController {
  constructor(private readonly clienteService: ClienteService) {}

  @Get('sessao')
  @ApiOperation({ summary: 'Reconhece a cliente pelo dispositivo' })
  @ApiOkResponse({ type: SessaoClientePublicaResponseDto.Output })
  async consultarSessao(
    @TenantFromPath() tenant: TenantContext,
    @Query() query: ConsultarSessaoClienteQueryDto,
  ) {
    const cliente = await this.clienteService.resolverSessaoPublica({
      credencial: query.credencial,
      salaoId: tenant.salaoId,
    });

    return toSessaoClientePublicaResponse(cliente);
  }

  @Post('identificacao')
  @ApiOperation({ summary: 'Identifica ou cadastra a cliente' })
  @ApiCreatedResponse({ type: SessaoClientePublicaResponseDto.Output })
  @ApiConflictResponse({ description: 'Credencial usada por outro salão.' })
  async identificar(
    @TenantFromPath() tenant: TenantContext,
    @Body() dados: IdentificarClientePublicaRequestDto,
  ) {
    const cliente = await this.clienteService.identificarPublicamente({
      dados,
      salaoId: tenant.salaoId,
    });

    return toSessaoClientePublicaResponse(cliente);
  }
}
