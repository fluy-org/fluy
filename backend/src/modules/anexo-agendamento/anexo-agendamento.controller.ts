import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AnexoAgendamentoService } from '@/modules/anexo-agendamento/anexo-agendamento.service';
import {
  AnexoAgendamentoResponseDto,
  ListaAnexosAgendamentoResponseDto,
} from '@/modules/anexo-agendamento/contracts';
import {
  toAnexoAgendamentoResponse,
  toListaAnexosAgendamentoResponse,
} from '@/modules/anexo-agendamento/anexo-agendamento.mapper';
import { TAMANHO_MAXIMO_ANEXO_BYTES } from '@/modules/arquivo/arquivo-data';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Anexos de agendamento')
@ApiBearerAuth()
@Controller('agendamentos/:agendamentoId/anexos')
export class AnexoAgendamentoController {
  constructor(private readonly anexoService: AnexoAgendamentoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os anexos internos do agendamento' })
  @ApiOkResponse({ type: ListaAnexosAgendamentoResponseDto.Output })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async listar(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toListaAnexosAgendamentoResponse(
      await this.anexoService.listarInternos({
        agendamentoId,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Get('referencias')
  @ApiOperation({ summary: 'Lista as referências enviadas pela cliente' })
  @ApiOkResponse({ type: ListaAnexosAgendamentoResponseDto.Output })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async listarReferencias(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toListaAnexosAgendamentoResponse(
      await this.anexoService.listarReferenciasDoSalao({
        agendamentoId,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Get('referencias/:id/conteudo')
  @ApiOperation({ summary: 'Abre uma referência enviada pela cliente' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({
    description: 'Conteúdo binário da referência.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Referência não encontrada.' })
  async obterConteudoReferencia(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    const { anexo, objeto } =
      await this.anexoService.obterConteudoReferenciaDoSalao({
        id,
        agendamentoId,
        salaoId: tenant.salaoId,
      });

    return new StreamableFile(objeto.body, {
      type: objeto.contentType ?? anexo.arquivo.mime_type,
      length: objeto.contentLength,
      disposition: `inline; filename="${anexo.id}"`,
    });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: TAMANHO_MAXIMO_ANEXO_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Adiciona um anexo interno ao agendamento' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: AnexoAgendamentoResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Arquivo inválido ou limite de anexos atingido.',
  })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async criar(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @TenantFromOwner() tenant: TenantContext,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
  ) {
    return toAnexoAgendamentoResponse(
      await this.anexoService.criarInterno({
        agendamentoId,
        salaoId: tenant.salaoId,
        arquivo: arquivo
          ? {
              buffer: arquivo.buffer,
              mimeType: arquivo.mimetype,
              tamanhoBytes: arquivo.size,
            }
          : undefined,
      }),
    );
  }

  @Get(':id/conteudo')
  @ApiOperation({ summary: 'Abre o conteúdo de um anexo interno' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({
    description: 'Conteúdo binário do anexo.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Anexo não encontrado.' })
  async obterConteudo(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    const { anexo, objeto } = await this.anexoService.obterConteudo({
      id,
      agendamentoId,
      salaoId: tenant.salaoId,
    });

    return new StreamableFile(objeto.body, {
      type: objeto.contentType ?? anexo.arquivo.mime_type,
      length: objeto.contentLength,
      disposition: `inline; filename="${anexo.id}"`,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um anexo interno do agendamento' })
  @ApiNoContentResponse({ description: 'Anexo removido.' })
  @ApiUnauthorizedResponse({ description: 'Bearer token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Anexo não encontrado.' })
  async remover(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ): Promise<void> {
    await this.anexoService.removerInterno({
      id,
      agendamentoId,
      salaoId: tenant.salaoId,
    });
  }
}
