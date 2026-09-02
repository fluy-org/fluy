jest.mock('@fluy/schema', () => ({}));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }), {
  virtual: true,
});
jest.mock('node:crypto', () => ({ randomUUID: () => 'chave-storage' }));

import type {
  ArquivoPersistido,
  ArquivoRecebido,
  ArquivoValidado,
  CriarArquivoInput,
  EnviarArquivoInput,
} from '@/modules/arquivo/contracts';
import { ArquivoRepository } from '@/modules/arquivo/arquivo.repository';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';
import { ArquivoValidator } from '@/modules/arquivo/arquivo.validator';
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

  it('persiste o arquivo no salao autenticado antes do upload', async () => {
    const arquivoRecebido: ArquivoRecebido = {
      buffer: Buffer.from('imagem'),
      mimeType: 'image/png',
      tamanhoBytes: 6,
    };
    const input: EnviarArquivoInput = {
      arquivo: arquivoRecebido,
      salaoId: 'salao-ana',
    };
    const arquivoValidado: ArquivoValidado = {
      buffer: arquivoRecebido.buffer,
      mimeType: 'image/png',
      tamanhoBytes: 6,
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
    expect(criar).toHaveBeenCalledWith({
      mimeType: arquivoValidado.mimeType,
      salaoId: input.salaoId,
      tamanhoBytes: arquivoValidado.tamanhoBytes,
      urlStorage: 'chave-storage',
    });

    expect(putObject).toHaveBeenCalledWith({
      body: arquivoValidado.buffer,
      contentType: arquivoValidado.mimeType,
      key: 'chave-storage',
    });
    expect(criar.mock.invocationCallOrder[0]).toBeLessThan(
      putObject.mock.invocationCallOrder[0],
    );
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
