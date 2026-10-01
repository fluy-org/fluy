import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AtualizarNotaRequestDto,
  CriarNotaRequestDto,
  ListaNotasResponseDto,
  ListarNotaQueryDto,
  NotaResponseDto,
} from '@/modules/nota/contracts';
import {
  toListaNotasResponse,
  toNotaResponse,
} from '@/modules/nota/nota.mapper';
import { NotaService } from '@/modules/nota/nota.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Notas')
@ApiBearerAuth()
@Controller('notas')
export class NotaController {
  constructor(private readonly notaService: NotaService) {}

  @Post()
  @ApiOperation({
    summary: 'Registra uma nota sobre uma cliente ou um agendamento dela',
  })
  @ApiCreatedResponse({
    description: 'Nota registrada.',
    type: NotaResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Dados da nota inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Cliente ativa ou agendamento não encontrado.',
  })
  async criar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: CriarNotaRequestDto,
  ) {
    return toNotaResponse(
      await this.notaService.criar({
        dados,
        salaoId: tenant.salaoId,
        usuarioSalaoId: tenant.usuarioSalaoId,
      }),
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista as notas de uma cliente ou de um agendamento, paginada por cursor',
  })
  @ApiOkResponse({
    description: 'Página de notas, da mais recente para a mais antiga.',
    type: ListaNotasResponseDto.Output,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de consulta ou cursor inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  async listar(
    @TenantFromOwner() tenant: TenantContext,
    @Query() query: ListarNotaQueryDto,
  ) {
    return toListaNotasResponse(
      await this.notaService.listar({
        salaoId: tenant.salaoId,
        clienteId: query.cliente_id,
        agendamentoId: query.agendamento_id,
        cursor: query.cursor,
      }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza o texto de uma nota' })
  @ApiOkResponse({
    description: 'Nota atualizada.',
    type: NotaResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'ID ou dados da nota inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Nota não encontrada.' })
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarNotaRequestDto,
  ) {
    return toNotaResponse(
      await this.notaService.atualizar({ dados, id, salaoId: tenant.salaoId }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui uma nota' })
  @ApiNoContentResponse({ description: 'Nota excluída.' })
  @ApiBadRequestResponse({ description: 'ID da nota inválido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Nota não encontrada.' })
  async remover(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ): Promise<void> {
    await this.notaService.remover({ id, salaoId: tenant.salaoId });
  }
}
