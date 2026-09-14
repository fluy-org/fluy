import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import {
  AgendamentoResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  AvaliarHorarioAgendamentoQueryDto,
  CriarAgendamentoRequestDto,
  HorariosLivresResponseDto,
  ListarHorariosLivresQueryDto,
} from '@/modules/agendamento/contracts';
import {
  toAgendamentoResponse,
  toAvaliacaoHorarioResponse,
  toHorariosLivresResponse,
} from '@/modules/agendamento/agendamento.mapper';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Get('horarios-livres')
  @ApiOperation({
    summary: 'Lista horários livres para um procedimento em um dia',
  })
  @ApiOkResponse({
    description: 'Horários livres no fuso do salão.',
    type: HorariosLivresResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Salão, configuração ou procedimento não encontrado.',
  })
  async listarHorariosLivres(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarHorariosLivresQueryDto,
  ) {
    return toHorariosLivresResponse(
      await this.agendamentoService.listarHorariosLivres({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get('avaliacao')
  @ApiOperation({ summary: 'Avalia um horário manual antes da criação' })
  @ApiOkResponse({
    description: 'Disponibilidade, avisos e bloqueios do horário.',
    type: AvaliacaoHorarioAgendamentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Salão, configuração ou procedimento não encontrado.',
  })
  async avaliarHorario(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: AvaliarHorarioAgendamentoQueryDto,
  ) {
    return toAvaliacaoHorarioResponse(
      await this.agendamentoService.avaliarHorario({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cria um agendamento manual no salão atual' })
  @ApiCreatedResponse({
    description: 'Agendamento criado em agendado.',
    type: AgendamentoResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou exceções não confirmadas.',
  })
  @ApiConflictResponse({
    description: 'O horário deixou de estar disponível.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Salão, configuração, cliente ou procedimento não encontrado.',
  })
  async criar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: CriarAgendamentoRequestDto,
  ) {
    return toAgendamentoResponse(
      await this.agendamentoService.criar({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }
}
