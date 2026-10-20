import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ConsultarPagamentoPixQueryDto,
  CriarReservaRequestDto,
  IniciarPagamentoPixRequestDto,
  PagamentoPixResponseDto,
  ReservaPixResponseDto,
  SimularPagamentoPixRequestDto,
  SimularPagamentoPixResponseDto,
} from '@/modules/pagamento/contracts';
import {
  toPagamentoPixResponse,
  toReservaPixResponse,
} from '@/modules/pagamento/pagamento.mapper';
import { PagamentoPublicoService } from '@/modules/pagamento/pagamento-publico.service';
import { PagamentoSimulacaoService } from '@/modules/pagamento/pagamento-simulacao.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Pagamento público')
@Controller('publico/s/:subdominio/reservas')
export class PagamentoPublicoController {
  constructor(private readonly service: PagamentoPublicoService) {}

  @Post()
  @ApiOperation({ summary: 'Reserva um horário para pagamento Pix' })
  @ApiCreatedResponse({ type: ReservaPixResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Dados ou horário inválidos.' })
  @ApiConflictResponse({ description: 'O horário deixou de estar disponível.' })
  @ApiNotFoundResponse({
    description:
      'Salão, sessão, procedimento ou recebimento Pix não encontrado.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Pagamento online indisponível.',
  })
  async reservar(
    @TenantFromPath() tenant: TenantContext,
    @Body() dados: CriarReservaRequestDto,
  ) {
    return toReservaPixResponse(
      await this.service.reservar({ salaoId: tenant.salaoId, dados }),
    );
  }

  @Post(':id/pagamentos')
  @ApiOperation({ summary: 'Inicia uma cobrança Pix para a reserva' })
  @ApiCreatedResponse({ type: PagamentoPixResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Dados ou cotação inválidos.' })
  @ApiConflictResponse({
    description: 'Reserva expirada ou tentativa de pagamento incompatível.',
  })
  @ApiNotFoundResponse({
    description: 'Reserva ou sessão da cliente não encontrada.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Pagamento online indisponível.',
  })
  async iniciar(
    @TenantFromPath() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: IniciarPagamentoPixRequestDto,
  ) {
    return toPagamentoPixResponse(
      await this.service.iniciar({
        salaoId: tenant.salaoId,
        agendamentoId: id,
        dados,
      }),
    );
  }

  @Get(':id/pagamento')
  @ApiOperation({ summary: 'Consulta o pagamento de uma reserva' })
  @ApiOkResponse({ type: PagamentoPixResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Identificador ou credencial inválida.',
  })
  @ApiNotFoundResponse({
    description: 'Pagamento ou sessão da cliente não encontrada.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Pagamento online indisponível.',
  })
  async consultar(
    @TenantFromPath() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dados: ConsultarPagamentoPixQueryDto,
  ) {
    return toPagamentoPixResponse(
      await this.service.consultar({
        salaoId: tenant.salaoId,
        agendamentoId: id,
        credencial: dados.credencial,
      }),
    );
  }
}

@ApiTags('Pagamento fake de desenvolvimento')
@ApiBearerAuth()
@Controller('salao/pagamentos/fake')
export class PagamentoFakeController {
  constructor(private readonly service: PagamentoSimulacaoService) {}

  @Post(':id/simular')
  @ApiOperation({
    summary: 'Simula uma notificação de pagamento no desenvolvimento',
  })
  @ApiOkResponse({ type: SimularPagamentoPixResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Cobrança fake já encerrada ou expirada.',
  })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Cobrança não encontrada neste salão.' })
  @ApiServiceUnavailableResponse({
    description: 'Simulação indisponível neste ambiente.',
  })
  async simular(
    @TenantFromOwner() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: SimularPagamentoPixRequestDto,
  ) {
    await this.service.simular({
      salaoId: tenant.salaoId,
      cobrancaId: id,
      resultado: dados.resultado,
    });
    return { processado: true as const };
  }
}
