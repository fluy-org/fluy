import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AtualizarLembreteRequestDto,
  CriarLembreteRequestDto,
  LembreteResponseDto,
  ListaLembretesResponseDto,
  ListarLembreteQueryDto,
} from '@/modules/lembrete/contracts';
import {
  toLembreteResponse,
  toListaLembretesResponse,
} from '@/modules/lembrete/lembrete.mapper';
import { LembreteService } from '@/modules/lembrete/lembrete.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Lembretes')
@ApiBearerAuth()
@Controller('lembretes')
export class LembreteController {
  constructor(private readonly lembreteService: LembreteService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um lembrete manual para uma cliente' })
  @ApiCreatedResponse({
    description: 'Lembrete criado e ativo.',
    type: LembreteResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Dados do lembrete inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Cliente ativa ou agendamento não encontrado.',
  })
  async criar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: CriarLembreteRequestDto,
  ) {
    return toLembreteResponse(
      await this.lembreteService.criar({
        dados,
        salaoId: tenant.salaoId,
        usuarioSalaoId: tenant.usuarioSalaoId,
      }),
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os lembretes ativos do salão, paginada por cursor',
  })
  @ApiOkResponse({
    description:
      'Página de lembretes ativos, da data alvo mais antiga à mais nova.',
    type: ListaLembretesResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de consulta ou cursor inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  async listar(
    @TenantFromOwner() tenant: TenantContext,
    @Query() query: ListarLembreteQueryDto,
  ) {
    return toListaLembretesResponse(
      await this.lembreteService.listar({
        salaoId: tenant.salaoId,
        periodo: query.periodo,
        origem: query.origem,
        busca: query.busca,
        clienteId: query.cliente_id,
        agendamentoId: query.agendamento_id,
        cursor: query.cursor,
      }),
    );
  }

  @Patch(':id/concluir')
  @ApiOperation({ summary: 'Marca um lembrete como concluído' })
  @ApiOkResponse({
    description: 'Lembrete concluído.',
    type: LembreteResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'ID do lembrete inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado.' })
  @ApiConflictResponse({ description: 'Lembrete já concluído.' })
  async concluir(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toLembreteResponse(
      await this.lembreteService.concluir({ id, salaoId: tenant.salaoId }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza o texto ou a data alvo de um lembrete' })
  @ApiOkResponse({
    description: 'Lembrete atualizado.',
    type: LembreteResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'ID ou dados do lembrete inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado.' })
  @ApiConflictResponse({ description: 'Lembrete já concluído.' })
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarLembreteRequestDto,
  ) {
    return toLembreteResponse(
      await this.lembreteService.atualizar({
        dados,
        id,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um lembrete' })
  @ApiNoContentResponse({ description: 'Lembrete excluído.' })
  @ApiBadRequestResponse({ description: 'ID do lembrete inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado.' })
  async remover(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ): Promise<void> {
    await this.lembreteService.remover({ id, salaoId: tenant.salaoId });
  }
}
