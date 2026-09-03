import { BadRequestException, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import type {
  ArquivoRecebido,
  ArquivoValidado,
} from '@/modules/arquivo/contracts';
import {
  LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB,
  TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES,
} from '@/modules/arquivo/arquivo-data';
import { ehTipoMimeImagem } from '@/modules/arquivo/arquivo-utils';

@Injectable()
export class ArquivoValidator {
  async validar(
    arquivo: ArquivoRecebido | undefined,
  ): Promise<ArquivoValidado> {
    if (!arquivo) {
      throw new BadRequestException('Envie um arquivo.');
    }

    if (arquivo.tamanhoBytes > TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES) {
      throw new BadRequestException(
        `O arquivo deve ter no maximo ${LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB} MiB.`,
      );
    }

    const tipoDetectado = await fileTypeFromBuffer(arquivo.buffer);

    if (
      !tipoDetectado ||
      !ehTipoMimeImagem(tipoDetectado.mime) ||
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
