import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import {
  ArquivoUploadResponseDto,
  TAMANHO_MAXIMO_ARQUIVO_BYTES,
} from '@/modules/arquivo/contracts';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';

@ApiTags('Arquivos')
@ApiBearerAuth()
@Controller('arquivos')
export class ArquivoController {
  constructor(private readonly arquivoService: ArquivoService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: TAMANHO_MAXIMO_ARQUIVO_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Envia uma imagem do salao atual' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['arquivo'],
      properties: {
        arquivo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Arquivo enviado.',
    type: ArquivoUploadResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Arquivo invalido.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou invalido.',
  })
  async enviar(
    @TenantFromOwner() tenant: TenantContext,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
  ) {
    return this.arquivoService.enviar({
      arquivo: arquivo
        ? {
            buffer: arquivo.buffer,
            mimeType: arquivo.mimetype,
            tamanhoBytes: arquivo.size,
          }
        : undefined,
      salaoId: tenant.salaoId,
    });
  }
}
