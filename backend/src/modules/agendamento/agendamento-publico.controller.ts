import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
} from '@/modules/agendamento/contracts';
import {
  toAgendamentoResponse,
  toHorariosLivresResponse,
} from '@/modules/agendamento/agendamento.mapper';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Agendamento público')
@Controller('publico/s/:subdominio/agendamentos')
export class AgendamentoPublicoController {
  constructor(
    private readonly agendamentoPublicoService: AgendamentoPublicoService,
  ) {}

  @Get('horarios-livres')
  @ApiOperation({ summary: 'Lista horários livres para a cliente identificada' })
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
