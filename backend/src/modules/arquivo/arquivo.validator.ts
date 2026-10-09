import { BadRequestException, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import type {
  ArquivoRecebido,
  ArquivoValidado,
} from '@/modules/arquivo/contracts';
import {
  LIMITE_TAMANHO_ANEXO_MIB,
  LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES,
} from '@/modules/arquivo/arquivo-data';
import { ehTipoMimeImagem } from '@/modules/arquivo/arquivo-utils';

@Injectable()
export class ArquivoValidator {
  async validar(
    arquivo: ArquivoRecebido | undefined,
  ): Promise<ArquivoValidado> {
    return this.validarComLimite({
      arquivo,
      limiteBytes: TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES,
      limiteMiB: LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB,
    });
  }

  async validarAnexo(
    arquivo: ArquivoRecebido | undefined,
  ): Promise<ArquivoValidado> {
    return this.validarComLimite({
      arquivo,
      limiteBytes: TAMANHO_MAXIMO_ANEXO_BYTES,
      limiteMiB: LIMITE_TAMANHO_ANEXO_MIB,
    });
  }

  private async validarComLimite({
    arquivo,
    limiteBytes,
    limiteMiB,
  }: {
    arquivo: ArquivoRecebido | undefined;
    limiteBytes: number;
    limiteMiB: number;
  }): Promise<ArquivoValidado> {
    if (!arquivo) {
      throw new BadRequestException('Envie um arquivo.');
    }

    if (arquivo.tamanhoBytes > limiteBytes) {
      throw new BadRequestException(
        `O arquivo deve ter no maximo ${limiteMiB} MiB.`,
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
