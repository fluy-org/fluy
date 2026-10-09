import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
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
import { ConsultarAgendamentoPublicoQueryDto } from '@/modules/agendamento/contracts';
import { TAMANHO_MAXIMO_ANEXO_BYTES } from '@/modules/arquivo/arquivo-data';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromPath } from '@/shared/tenant-context/decorators/tenant-from-path.decorator';

@ApiTags('Referências de agendamento público')
@Controller('publico/s/:subdominio/agendamentos/:agendamentoId/referencias')
export class AnexoAgendamentoPublicoController {
  constructor(private readonly anexoService: AnexoAgendamentoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as referências do agendamento da cliente' })
  @ApiOkResponse({ type: ListaAnexosAgendamentoResponseDto.Output })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async listar(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Query() dados: ConsultarAgendamentoPublicoQueryDto,
    @TenantFromPath() tenant: TenantContext,
  ) {
    const escopo = await this.anexoService.resolverEscopoDaCliente({
      agendamentoId,
      credencial: dados.credencial,
      salaoId: tenant.salaoId,
    });

    return toListaAnexosAgendamentoResponse(
      await this.anexoService.listarReferenciasDaCliente(escopo),
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: TAMANHO_MAXIMO_ANEXO_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Adiciona uma referência ao próprio agendamento' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: AnexoAgendamentoResponseDto.Output })
  @ApiBadRequestResponse({
    description: 'Arquivo inválido ou limite de referências atingido.',
  })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado.' })
  async criar(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Query() dados: ConsultarAgendamentoPublicoQueryDto,
    @TenantFromPath() tenant: TenantContext,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
  ) {
    const escopo = await this.anexoService.resolverEscopoDaCliente({
      agendamentoId,
      credencial: dados.credencial,
      salaoId: tenant.salaoId,
    });

    return toAnexoAgendamentoResponse(
      await this.anexoService.criarReferencia({
        ...escopo,
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
  @ApiOperation({ summary: 'Abre uma referência do agendamento da cliente' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({
    description: 'Conteúdo binário da referência.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({ description: 'Referência não encontrada.' })
  async obterConteudo(
    @Param('agendamentoId', new ParseUUIDPipe()) agendamentoId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() dados: ConsultarAgendamentoPublicoQueryDto,
    @TenantFromPath() tenant: TenantContext,
  ) {
    const escopo = await this.anexoService.resolverEscopoDaCliente({
      agendamentoId,
      credencial: dados.credencial,
      salaoId: tenant.salaoId,
    });
    const { anexo, objeto } =
      await this.anexoService.obterConteudoReferenciaDaCliente({
        ...escopo,
        id,
      });

    return new StreamableFile(objeto.body, {
      type: objeto.contentType ?? anexo.arquivo.mime_type,
      length: objeto.contentLength,
      disposition: `inline; filename="${anexo.id}"`,
    });
  }
}
