import { BadRequestException, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import type {
  ArquivoRecebido,
  ArquivoValidado,
} from '@/modules/arquivo/contracts';
import { TAMANHO_MAXIMO_ARQUIVO_BYTES } from '@/modules/arquivo/contracts';

const TIPOS_DE_IMAGEM_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class ArquivoValidator {
  async validar(
    arquivo: ArquivoRecebido | undefined,
  ): Promise<ArquivoValidado> {
    if (!arquivo) {
      throw new BadRequestException('Envie um arquivo.');
    }

    if (arquivo.tamanhoBytes > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
      throw new BadRequestException('O arquivo deve ter no maximo 5 MiB.');
    }

    const tipoDetectado = await fileTypeFromBuffer(arquivo.buffer);

    if (
      !tipoDetectado ||
      !TIPOS_DE_IMAGEM_PERMITIDOS.has(tipoDetectado.mime) ||
      tipoDetectado.mime !== arquivo.mimeType
    ) {
      throw new BadRequestException(
        'Envie uma imagem JPEG, PNG ou WebP valida.',
      );
    }

    return {
      buffer: arquivo.buffer,
      mimeType: tipoDetectado.mime,
      tamanhoBytes: arquivo.tamanhoBytes,
    };
  }
}
