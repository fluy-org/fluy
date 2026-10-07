import { Controller, Get, Query } from '@nestjs/common';
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
  FaturamentoResponseDto,
  ListaAtendimentosFaturamentoResponseDto,
  ListarAtendimentosFaturamentoQueryDto,
  ListarFaturamentoQueryDto,
} from '@/modules/faturamento/contracts';
import {
  toFaturamentoResponse,
  toListaAtendimentosFaturamentoResponse,
} from '@/modules/faturamento/faturamento.mapper';
import { FaturamentoService } from '@/modules/faturamento/faturamento.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Faturamento')
@ApiBearerAuth()
@Controller('faturamento')
export class FaturamentoController {
  constructor(private readonly faturamentoService: FaturamentoService) {}

  @Get('atendimentos')
  @ApiOperation({
    summary:
      'Lista os atendimentos concluídos no período, paginados por cursor',
  })
  @ApiOkResponse({
    description:
      'Página de atendimentos, do mais recente para o mais antigo, com sinal, restante e valor pendente.',
    type: ListaAtendimentosFaturamentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Período ou cursor inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async listarAtendimentos(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarAtendimentosFaturamentoQueryDto,
  ) {
    return toListaAtendimentosFaturamentoResponse(
      await this.faturamentoService.listarAtendimentos({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Fecha o período: resumo, recebimento por método e sinais retidos',
  })
  @ApiOkResponse({
    description: 'Fechamento do período no fuso do salão.',
    type: FaturamentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Período inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async buscar(
    @TenantFromOwner() tenant: TenantContext,
    @Query() dados: ListarFaturamentoQueryDto,
  ) {
    return toFaturamentoResponse(
      await this.faturamentoService.buscar({
        salaoId: tenant.salaoId,
        dados,
      }),
    );
  }
}
