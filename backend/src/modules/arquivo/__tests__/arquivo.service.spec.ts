jest.mock('@fluy/schema', () => ({}));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }), {
  virtual: true,
});
jest.mock('node:crypto', () => ({ randomUUID: () => 'chave-storage' }));

import sharp from 'sharp';
import type {
  ArquivoOrfaoExpirado,
  ArquivoPersistido,
  ArquivoRecebido,
  ArquivoValidado,
  CriarArquivoInput,
  EnviarArquivoInput,
} from '@/modules/arquivo/contracts';
import { ArquivoRepository } from '@/modules/arquivo/arquivo.repository';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';
import { ArquivoValidator } from '@/modules/arquivo/arquivo.validator';
import { TAMANHO_LOTE_LIMPEZA_ORFAOS } from '@/modules/arquivo/arquivo-data';
import type {
  PutStorageObjectInput,
  StorageProvider,
} from '@/shared/storage/contracts';

describe('ArquivoService', () => {
  const criar = jest.fn<Promise<ArquivoPersistido>, [CriarArquivoInput]>();
  const buscarPorIdDoSalao = jest.fn();
  const listarOrfaosExpirados = jest.fn();
  const removerSeOrfao = jest.fn();
  const repository = {
    criar,
    buscarPorIdDoSalao,
    listarOrfaosExpirados,
    removerSeOrfao,
  } as unknown as ArquivoRepository;
  const validar = jest.fn<
    Promise<ArquivoValidado>,
    [ArquivoRecebido | undefined]
  >();
  const validator = {
    validar,
  } as unknown as ArquivoValidator;
  const putObject = jest.fn<Promise<void>, [PutStorageObjectInput]>();
  const getObject = jest.fn();
  const deleteObject = jest.fn();
  const storage = {
    putObject,
    getObject,
    deleteObject,
  } as unknown as StorageProvider;
  const service = new ArquivoService(repository, validator, storage);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('comprime o arquivo antes de persistir e enviar ao storage', async () => {
    const bufferOriginal = await sharp({
      create: {
        width: 2_500,
        height: 100,
        channels: 3,
        background: { r: 20, g: 80, b: 160 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();
    const arquivoRecebido: ArquivoRecebido = {
      buffer: bufferOriginal,
      mimeType: 'image/jpeg',
      tamanhoBytes: bufferOriginal.byteLength,
    };
    const input: EnviarArquivoInput = {
      arquivo: arquivoRecebido,
      salaoId: 'salao-ana',
    };
    const arquivoValidado: ArquivoValidado = {
      buffer: arquivoRecebido.buffer,
      mimeType: 'image/jpeg',
      tamanhoBytes: bufferOriginal.byteLength,
    };
    const arquivoPersistido = criarArquivoPersistido({
      salao_id: input.salaoId,
    });

    validar.mockResolvedValue(arquivoValidado);
    criar.mockResolvedValue(arquivoPersistido);
    putObject.mockResolvedValue();

    expect(await service.enviar(input)).toEqual({
      arquivo_id: arquivoPersistido.id,
    });
    const arquivoCriado = criar.mock.calls[0][0];
    const objetoEnviado = putObject.mock.calls[0][0];

    expect(arquivoCriado).toEqual({
      mimeType: 'image/jpeg',
      salaoId: input.salaoId,
      tamanhoBytes: objetoEnviado.body.byteLength,
      urlStorage: 'chave-storage',
    });
    expect(objetoEnviado).toMatchObject({
      contentType: 'image/jpeg',
      key: 'chave-storage',
    });
    expect((await sharp(objetoEnviado.body).metadata()).width).toBe(2_000);
    expect(criar.mock.invocationCallOrder[0]).toBeLessThan(
      putObject.mock.invocationCallOrder[0],
    );
  });

  it('recusa a imagem que continua maior que o limite apos a compressao', async () => {
    const pixels = Buffer.allocUnsafe(2_000 * 2_000 * 3);
    let semente = 123_456_789;

    for (let indice = 0; indice < pixels.length; indice += 1) {
      semente = (Math.imul(semente, 1_664_525) + 1_013_904_223) >>> 0;
      pixels[indice] = semente >>> 24;
    }

    const bufferOriginal = await sharp(pixels, {
      raw: { width: 2_000, height: 2_000, channels: 3 },
    })
      .png()
      .toBuffer();
    const arquivoRecebido: ArquivoRecebido = {
      buffer: bufferOriginal,
      mimeType: 'image/png',
      tamanhoBytes: bufferOriginal.byteLength,
    };

    validar.mockResolvedValue({
      ...arquivoRecebido,
      mimeType: 'image/png',
    });

    await expect(
      service.enviar({ arquivo: arquivoRecebido, salaoId: 'salao-ana' }),
    ).rejects.toThrow('A imagem processada deve ter no maximo 5 MiB.');

    expect(criar).not.toHaveBeenCalled();
    expect(putObject).not.toHaveBeenCalled();
  });

  it('ignora a validacao de pertencimento quando nao ha arquivo informado', async () => {
    await service.validarArquivoOpcionalDoSalao({
      arquivoId: undefined,
      salaoId: 'salao-ana',
    });

    expect(buscarPorIdDoSalao).not.toHaveBeenCalled();
  });

  it('valida o pertencimento quando ha arquivo informado', async () => {
    const arquivoId = 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43';
    buscarPorIdDoSalao.mockResolvedValue(
      criarArquivoPersistido({ id: arquivoId }),
    );

    await service.validarArquivoOpcionalDoSalao({
      arquivoId,
      salaoId: 'salao-ana',
    });

    expect(buscarPorIdDoSalao).toHaveBeenCalledWith({
      id: arquivoId,
      salaoId: 'salao-ana',
    });
  });

  it('limpa os arquivos orfaos em lotes', async () => {
    const primeiroLote: ArquivoOrfaoExpirado[] = Array.from(
      { length: TAMANHO_LOTE_LIMPEZA_ORFAOS },
      (_, indice) => ({
        id: `arquivo-${indice}`,
        url_storage: `arquivo-${indice}`,
      }),
    );
    const ultimoArquivo: ArquivoOrfaoExpirado = {
      id: 'arquivo-final',
      url_storage: 'segundo-arquivo',
    };

    listarOrfaosExpirados
      .mockResolvedValueOnce(primeiroLote)
      .mockResolvedValueOnce([ultimoArquivo]);
    deleteObject.mockResolvedValue(undefined);
    removerSeOrfao.mockResolvedValue(true);

    await service.limparOrfaosExpirados();

    expect(listarOrfaosExpirados).toHaveBeenNthCalledWith(
      1,
      expect.any(Date),
      TAMANHO_LOTE_LIMPEZA_ORFAOS,
    );
    expect(listarOrfaosExpirados).toHaveBeenCalledTimes(2);
    expect(deleteObject).toHaveBeenCalledTimes(TAMANHO_LOTE_LIMPEZA_ORFAOS + 1);
    expect(deleteObject).toHaveBeenCalledWith(ultimoArquivo.url_storage);
    expect(removerSeOrfao).toHaveBeenCalledTimes(
      TAMANHO_LOTE_LIMPEZA_ORFAOS + 1,
    );
    expect(removerSeOrfao).toHaveBeenCalledWith(ultimoArquivo.id);
  });
});

function criarArquivoPersistido(
  input: Partial<ArquivoPersistido> = {},
): ArquivoPersistido {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'salao-ana',
    url_storage: 'chave-storage',
    mime_type: 'image/png',
    tamanho_bytes: 6,
    uploaded_em: new Date('2026-01-01T00:00:00.000Z'),
    ...input,
  };
}
