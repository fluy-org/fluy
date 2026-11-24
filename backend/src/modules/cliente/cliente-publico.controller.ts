import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
  @ApiHeader({
    name: 'x-cliente-credencial',
    required: false,
    description: 'Credencial do dispositivo da cliente',
  })
  @ApiOkResponse({ type: SessaoClientePublicaResponseDto.Output })
  async consultarSessao(
    @TenantFromPath() tenant: TenantContext,
    @Query() query?: ConsultarSessaoClienteQueryDto,
    @Headers('x-cliente-credencial') headerCredencial?: string,
  ) {
    const credencial = headerCredencial || query?.credencial;
    if (!credencial) {
      return toSessaoClientePublicaResponse(undefined);
    }

    const sessao = await this.clienteService.resolverSessaoPublica({
      credencial,
      salaoId: tenant.salaoId,
    });

    return toSessaoClientePublicaResponse(sessao);
  }

  @Delete('sessao')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga a sessão da cliente no dispositivo' })
  @ApiHeader({
    name: 'x-cliente-credencial',
    required: false,
    description: 'Credencial do dispositivo da cliente',
  })
  @ApiNoContentResponse({ description: 'Sessão revogada com sucesso.' })
  async revogarSessao(
    @TenantFromPath() tenant: TenantContext,
    @Query() query?: ConsultarSessaoClienteQueryDto,
    @Headers('x-cliente-credencial') headerCredencial?: string,
  ) {
    const credencial = headerCredencial || query?.credencial;
    if (credencial) {
      await this.clienteService.revogarSessaoPublica({
        credencial,
        salaoId: tenant.salaoId,
      });
    }
  }

  @Post('identificacao')
  @Throttle({
    identificacao_ip: { limit: 5, ttl: 60000 },
    identificacao_whatsapp: { limit: 3, ttl: 60000 },
  })
  @ApiOperation({ summary: 'Identifica ou cadastra a cliente' })
  @ApiCreatedResponse({ type: SessaoClientePublicaResponseDto.Output })
  @ApiConflictResponse({ description: 'Credencial usada por outro salão.' })
  async identificar(
    @TenantFromPath() tenant: TenantContext,
    @Body() dados: IdentificarClientePublicaRequestDto,
    @Headers('x-cliente-credencial') headerCredencial?: string,
  ) {
    const credencial = dados.credencial || headerCredencial || '';
    const sessao = await this.clienteService.identificarPublicamente({
      dados: { ...dados, credencial },
      salaoId: tenant.salaoId,
    });

    return toSessaoClientePublicaResponse(sessao);
  }
}
