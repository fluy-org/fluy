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
  AgendaDiaResponseDto,
  AgendamentoDetalheResponseDto,
  AgendamentoResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  AvaliarHorarioAgendamentoQueryDto,
  AvaliarHorarioRemarcacaoQueryDto,
  CancelarAgendamentoRequestDto,
  ConcluirAgendamentoRequestDto,
  CriarAgendamentoRequestDto,
  HorariosLivresResponseDto,
  ListarAgendaDiaQueryDto,
  ListarHorariosLivresQueryDto,
  ListarHorariosLivresRemarcacaoQueryDto,
  ListarResumoAgendaQueryDto,
  RemarcarAgendamentoRequestDto,
  ResumoAgendaResponseDto,
} from '@/modules/agendamento/contracts';
import {
  toAgendaDiaResponse,
  toAgendamentoDetalheResponse,
  toAgendamentoResponse,
  toAvaliacaoHorarioResponse,
  toHorariosLivresResponse,
  toResumoAgendaResponse,
} from '@/modules/agendamento/agendamento.mapper';
import { AgendamentoCancelamentoService } from '@/modules/agendamento/agendamento-cancelamento.service';
import { AgendamentoConclusaoService } from '@/modules/agendamento/agendamento-conclusao.service';
import { AgendamentoFaltaService } from '@/modules/agendamento/agendamento-falta.service';
import { AgendamentoRemarcacaoService } from '@/modules/agendamento/agendamento-remarcacao.service';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoConclusaoService: AgendamentoConclusaoService,
    private readonly agendamentoFaltaService: AgendamentoFaltaService,
    private readonly agendamentoCancelamentoService: AgendamentoCancelamentoService,
    private readonly agendamentoRemarcacaoService: AgendamentoRemarcacaoService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista os agendamentos de um dia do salão, sem paginação',
  })
  @ApiOkResponse({
    description:
      'Agendamentos do dia no fuso do salão, ordenados por horário crescente.',
    type: AgendaDiaResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async listarAgendaDoDia(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarAgendaDiaQueryDto,
  ) {
    return toAgendaDiaResponse(
      await this.agendamentoService.listarAgendaDoDia({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

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

  @Get('resumo')
  @ApiOperation({
    summary: 'Resume a quantidade de agendamentos por dia em um período',
  })
  @ApiOkResponse({
    description:
      'Dias com agendamento no período, contados pela data civil no fuso do salão.',
    type: ResumoAgendaResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Intervalo de datas inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async listarResumo(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarResumoAgendaQueryDto,
  ) {
    return toResumoAgendaResponse(
      await this.agendamentoService.listarResumoDoPeriodo({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get(':id/horarios-livres')
  @ApiOperation({
    summary: 'Lista horários livres para remarcar um agendamento',
  })
  @ApiOkResponse({
    description:
      'Horários livres no fuso do salão, com a duração congelada do agendamento e sem a ocupação dele.',
    type: HorariosLivresResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async listarHorariosLivresParaRemarcacao(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarHorariosLivresRemarcacaoQueryDto,
  ) {
    return toHorariosLivresResponse(
      await this.agendamentoRemarcacaoService.listarHorariosLivres({
        id,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get(':id/avaliacao')
  @ApiOperation({
    summary: 'Avalia um horário alvo antes de remarcar o agendamento',
  })
  @ApiOkResponse({
    description: 'Disponibilidade, avisos e bloqueios do horário alvo.',
    type: AvaliacaoHorarioAgendamentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async avaliarHorarioParaRemarcacao(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: AvaliarHorarioRemarcacaoQueryDto,
  ) {
    return toAvaliacaoHorarioResponse(
      await this.agendamentoRemarcacaoService.avaliarHorario({
        id,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Obtém o detalhe de um agendamento e as ações que o estado permite',
  })
  @ApiOkResponse({
    description: 'Agendamento com valores e ações contextuais.',
    type: AgendamentoDetalheResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Identificador inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async buscarDetalhe(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toAgendamentoDetalheResponse(
      await this.agendamentoService.buscarDetalhe({
        id,
        salaoId: tenant.salaoId,
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
        notificarCliente: true,
      }),
    );
  }

  @Patch(':id/concluir')
  @ApiOperation({
    summary: 'Conclui o atendimento e registra o pagamento do valor pendente',
  })
  @ApiOkResponse({
    description: 'Agendamento concluído, com valores e ações atualizados.',
    type: AgendamentoDetalheResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description:
      'Identificador ou dados inválidos, ou estado que não permite conclusão.',
  })
  @ApiConflictResponse({ description: 'O agendamento já foi encerrado.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async concluir(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: ConcluirAgendamentoRequestDto,
  ) {
    return toAgendamentoDetalheResponse(
      await this.agendamentoConclusaoService.concluir({
        id,
        salaoId: tenant.salaoId,
        usuarioSalaoId: tenant.usuarioSalaoId,
        dados,
      }),
    );
  }

  @Patch(':id/marcar-falta')
  @ApiOperation({
    summary: 'Marca que a cliente não compareceu ao atendimento',
  })
  @ApiOkResponse({
    description: 'Agendamento em falta, com valores e ações atualizados.',
    type: AgendamentoDetalheResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description:
      'Identificador inválido, atendimento ainda não iniciado ou estado que não permite a marcação.',
  })
  @ApiConflictResponse({ description: 'O agendamento já foi encerrado.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async marcarFalta(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toAgendamentoDetalheResponse(
      await this.agendamentoFaltaService.marcarFalta({
        id,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Patch(':id/cancelar')
  @ApiOperation({
    summary: 'Cancela o agendamento e libera o horário',
  })
  @ApiOkResponse({
    description: 'Agendamento cancelado, com valores e ações atualizados.',
    type: AgendamentoDetalheResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description: 'Identificador ou dados inválidos.',
  })
  @ApiConflictResponse({ description: 'O agendamento já foi encerrado.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async cancelar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: CancelarAgendamentoRequestDto,
  ) {
    return toAgendamentoDetalheResponse(
      await this.agendamentoCancelamentoService.cancelar({
        id,
        salaoId: tenant.salaoId,
        dados,
        canceladoPor: 'salao',
      }),
    );
  }

  @Patch(':id/remarcar')
  @ApiOperation({
    summary: 'Move o agendamento para outra data e hora, no mesmo registro',
  })
  @ApiOkResponse({
    description: 'Agendamento remarcado, com valores e ações atualizados.',
    type: AgendamentoDetalheResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description:
      'Identificador ou dados inválidos, horário no passado, horário igual ao atual, ou exceções não confirmadas.',
  })
  @ApiConflictResponse({
    description:
      'O agendamento já foi encerrado ou o horário deixou de estar disponível.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Agendamento, salão ou configuração não encontrados.',
  })
  async remarcar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: RemarcarAgendamentoRequestDto,
  ) {
    return toAgendamentoDetalheResponse(
      await this.agendamentoRemarcacaoService.remarcar({
        id,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }
}
