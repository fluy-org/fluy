import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AgendamentoPublicoService } from '@/modules/agendamento/agendamento-publico.service';
import {
  HorariosLivresResponseDto,
  ListarHorariosLivresPublicosQueryDto,
  CriarAgendamentoPublicoRequestDto,
  AgendamentoResponseDto,
  AgendamentoPublicoDetalheResponseDto,
  CancelarAgendamentoPublicoRequestDto,
  ConsultarAgendamentoPublicoQueryDto,
  ListaAgendamentosPublicosResponseDto,
  ListarAgendamentosPublicosQueryDto,
} from '@/modules/agendamento/contracts';
import {
  toAgendamentoPublicoDetalheResponse,
  toAgendamentoResponse,
  toHorariosLivresResponse,
  toListaAgendamentosPublicosResponse,
} from '@/modules/agendamento/agendamento.mapper';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Agendamento público')
@Controller('publico/s/:subdominio/agendamentos')
export class AgendamentoPublicoController {
  constructor(
    private readonly agendamentoPublicoService: AgendamentoPublicoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os agendamentos da cliente identificada' })
  @ApiOkResponse({ type: ListaAgendamentosPublicosResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Credencial ou cursor inválido.' })
  @ApiNotFoundResponse({ description: 'Sessão da cliente não encontrada.' })
  async listar(
    @TenantFromPath() tenant: TenantContext,
    @Query() dados: ListarAgendamentosPublicosQueryDto,
  ) {
    return toListaAgendamentosPublicosResponse(
      await this.agendamentoPublicoService.listar({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get('horarios-livres')
  @ApiOperation({
    summary: 'Lista horários livres para a cliente identificada',
  })
  @ApiOkResponse({ type: HorariosLivresResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiNotFoundResponse({
    description: 'Sessão, salão, configuração ou procedimento não encontrado.',
  })
  async listarHorariosLivres(
    @TenantFromPath() tenant: TenantContext,
    @Query() dados: ListarHorariosLivresPublicosQueryDto,
  ) {
    return toHorariosLivresResponse(
      await this.agendamentoPublicoService.listarHorariosLivres({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um agendamento da cliente identificada' })
  @ApiOkResponse({ type: AgendamentoPublicoDetalheResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Identificador ou credencial inválido.',
  })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async buscarDetalhe(
    @TenantFromPath() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dados: ConsultarAgendamentoPublicoQueryDto,
  ) {
    return toAgendamentoPublicoDetalheResponse(
      await this.agendamentoPublicoService.buscarDetalhe({
        id,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancela um agendamento da cliente identificada' })
  @ApiOkResponse({ type: AgendamentoPublicoDetalheResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Identificador ou credencial inválido.',
  })
  @ApiConflictResponse({ description: 'O agendamento já foi encerrado.' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async cancelar(
    @TenantFromPath() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: CancelarAgendamentoPublicoRequestDto,
  ) {
    return toAgendamentoPublicoDetalheResponse(
      await this.agendamentoPublicoService.cancelar({
        id,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cria o agendamento da cliente identificada' })
  @ApiCreatedResponse({ type: AgendamentoResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Dados ou horário inválidos.' })
  @ApiConflictResponse({ description: 'O horário deixou de estar disponível.' })
  @ApiNotFoundResponse({
    description: 'Sessão, salão, configuração ou procedimento não encontrado.',
  })
  async criar(
    @TenantFromPath() tenant: TenantContext,
    @Body() dados: CriarAgendamentoPublicoRequestDto,
  ) {
    return toAgendamentoResponse(
      await this.agendamentoPublicoService.criar({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }
}
