import { BadRequestException } from '@nestjs/common';

jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }), {
  virtual: true,
});

import { fileTypeFromBuffer } from 'file-type';
import type { ArquivoRecebido } from '@/modules/arquivo/contracts';
import {
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES,
} from '@/modules/arquivo/arquivo-data';
import { ArquivoValidator } from '@/modules/arquivo/arquivo.validator';

describe('ArquivoValidator', () => {
  const detectarTipo = jest.mocked(fileTypeFromBuffer);
  const validator = new ArquivoValidator();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejeita o envio sem arquivo', async () => {
    await expect(validator.validar(undefined)).rejects.toThrow(
      new BadRequestException('Envie um arquivo.'),
    );
    expect(detectarTipo).not.toHaveBeenCalled();
  });

  it('rejeita arquivo que excede o limite de tamanho antes de detectar o tipo', async () => {
    const arquivo = criarArquivo({
      tamanhoBytes: TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES + 1,
    });

    await expect(validator.validar(arquivo)).rejects.toThrow(
      new BadRequestException('O arquivo deve ter no maximo 20 MiB.'),
    );
    expect(detectarTipo).not.toHaveBeenCalled();
  });

  it('rejeita anexo acima de 5 MiB sem tentar processar o conteudo', async () => {
    const arquivo = criarArquivo({
      tamanhoBytes: TAMANHO_MAXIMO_ANEXO_BYTES + 1,
    });

    await expect(validator.validarAnexo(arquivo)).rejects.toThrow(
      new BadRequestException('O arquivo deve ter no maximo 5 MiB.'),
    );
    expect(detectarTipo).not.toHaveBeenCalled();
  });

  it('rejeita arquivo cujo conteudo nao identifica uma imagem permitida', async () => {
    const arquivo = criarArquivo();
    detectarTipo.mockResolvedValue(undefined);

    await expect(validator.validar(arquivo)).rejects.toThrow(
      new BadRequestException('Envie uma imagem JPEG, PNG ou WebP valida.'),
    );
    expect(detectarTipo).toHaveBeenCalledWith(arquivo.buffer);
  });

  it('rejeita quando o tipo declarado difere do tipo detectado', async () => {
    const arquivo = criarArquivo({ mimeType: 'image/jpeg' });
    detectarTipo.mockResolvedValue({ ext: 'png', mime: 'image/png' } as never);

    await expect(validator.validar(arquivo)).rejects.toThrow(
      new BadRequestException('Envie uma imagem JPEG, PNG ou WebP valida.'),
    );
  });

  it('retorna o arquivo validado com o tipo detectado', async () => {
    const arquivo = criarArquivo({ mimeType: 'image/webp' });
    detectarTipo.mockResolvedValue({
      ext: 'webp',
      mime: 'image/webp',
    } as never);

    await expect(validator.validar(arquivo)).resolves.toEqual({
      buffer: arquivo.buffer,
      mimeType: 'image/webp',
      tamanhoBytes: arquivo.tamanhoBytes,
    });
  });
});

function criarArquivo(input: Partial<ArquivoRecebido> = {}): ArquivoRecebido {
  return {
    buffer: Buffer.from('imagem'),
    mimeType: 'image/png',
    tamanhoBytes: 6,
    ...input,
  };
}
