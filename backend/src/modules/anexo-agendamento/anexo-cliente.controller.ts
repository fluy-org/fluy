import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AnexoAgendamentoService } from '@/modules/anexo-agendamento/anexo-agendamento.service';
import {
  ListaAnexosClienteResponseDto,
  ListarAnexosClienteQueryDto,
} from '@/modules/anexo-agendamento/contracts';
import { toListaAnexosClienteResponse } from '@/modules/anexo-agendamento/anexo-agendamento.mapper';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Galeria da cliente')
@ApiBearerAuth()
@Controller('clientes/:clienteId/anexos')
export class AnexoClienteController {
  constructor(private readonly anexoService: AnexoAgendamentoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista a galeria consolidada da cliente' })
  @ApiOkResponse({ type: ListaAnexosClienteResponseDto.Output })
  @ApiBadRequestResponse({ description: 'Consulta ou cursor inválido.' })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrada.' })
  async listar(
    @Param('clienteId', new ParseUUIDPipe()) clienteId: string,
    @Query() query: ListarAnexosClienteQueryDto,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toListaAnexosClienteResponse(
      await this.anexoService.listarDaCliente({
        clienteId,
        salaoId: tenant.salaoId,
        visibilidade: query.visibilidade,
        cursor: query.cursor,
      }),
    );
  }

  @Get(':id/conteudo')
  @ApiOperation({ summary: 'Abre uma imagem da galeria da cliente' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({
    description: 'Conteúdo binário da imagem.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Imagem não encontrada.' })
  async obterConteudo(
    @Param('clienteId', new ParseUUIDPipe()) clienteId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    const { anexo, objeto } =
      await this.anexoService.obterConteudoDaClientePeloSalao({
        clienteId,
        id,
        salaoId: tenant.salaoId,
      });

    return new StreamableFile(objeto.body, {
      type: objeto.contentType ?? anexo.arquivo.mime_type,
      length: objeto.contentLength,
      disposition: `inline; filename="${anexo.id}"`,
    });
  }
}
