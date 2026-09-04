import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import {
  AtualizarDisponibilidadeSemanalRequestDto,
  AtualizarOverrideDisponibilidadeRequestDto,
  DisponibilidadeSemanalResponseDto,
  ListaOverridesDisponibilidadeResponseDto,
  ListarOverridesDisponibilidadeQueryDto,
  OverrideDisponibilidadeResponseDto,
  ProfissionalResponseDto,
} from '@/modules/disponibilidade/contracts';
import {
  toDisponibilidadeSemanalResponse,
  toOverrideDisponibilidadeResponse,
  toOverridesResponse,
  toProfissionalResponse,
} from '@/modules/disponibilidade/disponibilidade.mapper';
import { DisponibilidadeService } from '@/modules/disponibilidade/disponibilidade.service';

@ApiTags('Disponibilidade')
@ApiBearerAuth()
@Controller('profissionais')
export class DisponibilidadeController {
  constructor(
    private readonly disponibilidadeService: DisponibilidadeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os profissionais do salão atual' })
  @ApiOkResponse({
    description: 'Profissionais do salão.',
    type: [ProfissionalResponseDto.Output],
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  async listarProfissionais(@TenantFromOwner() tenant: TenantContext) {
    const profissionais = await this.disponibilidadeService.listarProfissionais(
      tenant.salaoId,
    );

    return profissionais.map(toProfissionalResponse);
  }

  @Get(':id/disponibilidade/semanal')
  @ApiOperation({ summary: 'Busca o template semanal de um profissional' })
  @ApiOkResponse({
    description: 'Template semanal do profissional.',
    type: DisponibilidadeSemanalResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Profissional não encontrado.' })
  async buscarJanelasSemanais(
    @Param('id', new ParseUUIDPipe()) profissionalId: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toDisponibilidadeSemanalResponse(
      await this.disponibilidadeService.buscarJanelasSemanais({
        profissionalId,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Put(':id/disponibilidade/semanal')
  @ApiOperation({ summary: 'Substitui o template semanal de um profissional' })
  @ApiOkResponse({
    description: 'Template semanal atualizado.',
    type: DisponibilidadeSemanalResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Janelas semanais inválidas.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Profissional não encontrado.' })
  async atualizarJanelasSemanais(
    @Param('id', new ParseUUIDPipe()) profissionalId: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarDisponibilidadeSemanalRequestDto,
  ) {
    return toDisponibilidadeSemanalResponse(
      await this.disponibilidadeService.atualizarJanelasSemanais({
        profissionalId,
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get(':id/disponibilidade/overrides')
  @ApiOperation({ summary: 'Lista overrides de disponibilidade por período' })
  @ApiOkResponse({
    description: 'Overrides do período informado.',
    type: ListaOverridesDisponibilidadeResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Intervalo de datas inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Profissional não encontrado.' })
  async listarOverrides(
    @Param('id', new ParseUUIDPipe()) profissionalId: string,
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarOverridesDisponibilidadeQueryDto,
  ) {
    return toOverridesResponse(
      await this.disponibilidadeService.listarOverrides({
        profissionalId,
        salaoId: tenant.salaoId,
        dataInicio: dados.data_inicio,
        dataFim: dados.data_fim,
      }),
    );
  }

  @Put(':id/disponibilidade/overrides/:data')
  @ApiOperation({ summary: 'Cria ou substitui um override por data' })
  @ApiOkResponse({
    description: 'Override atualizado.',
    type: OverrideDisponibilidadeResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Override inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Profissional não encontrado.' })
  async atualizarOverride(
    @Param('id', new ParseUUIDPipe()) profissionalId: string,
    @Param('data') data: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarOverrideDisponibilidadeRequestDto,
  ) {
    return toOverrideDisponibilidadeResponse(
      await this.disponibilidadeService.atualizarOverride({
        profissionalId,
        salaoId: tenant.salaoId,
        data,
        dados,
      }),
    );
  }

  @Delete(':id/disponibilidade/overrides/:data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um override e reverte ao template semanal' })
  @ApiNoContentResponse({ description: 'Override removido ou já inexistente.' })
  @ApiBadRequestResponse({ description: 'Data inválida.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Profissional não encontrado.' })
  async removerOverride(
    @Param('id', new ParseUUIDPipe()) profissionalId: string,
    @Param('data') data: string,
    @TenantFromOwner() tenant: TenantContext,
  ): Promise<void> {
    await this.disponibilidadeService.removerOverride({
      profissionalId,
      salaoId: tenant.salaoId,
      data,
    });
  }
}
