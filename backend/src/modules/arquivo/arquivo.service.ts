import { randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type {
  BuscarArquivoDoSalaoInput,
  EnviarArquivoInput,
  ValidarArquivoOpcionalDoSalaoInput,
} from '@/modules/arquivo/contracts';
import { DURACAO_RETENCAO_ARQUIVO_ORFAO_MS } from '@/modules/arquivo/contracts';
import { ArquivoRepository } from '@/modules/arquivo/arquivo.repository';
import { ArquivoValidator } from '@/modules/arquivo/arquivo.validator';
import {
  STORAGE_PROVIDER,
  type StorageObject,
  type StorageProvider,
} from '@/shared/storage/contracts';

@Injectable()
export class ArquivoService {
  constructor(
    private readonly arquivoRepository: ArquivoRepository,
    private readonly arquivoValidator: ArquivoValidator,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async enviar({ arquivo, salaoId }: EnviarArquivoInput) {
    const arquivoValidado = await this.arquivoValidator.validar(arquivo);
    const chaveStorage = randomUUID();
    const arquivoPersistido = await this.arquivoRepository.criar({
      mimeType: arquivoValidado.mimeType,
      salaoId,
      tamanhoBytes: arquivoValidado.tamanhoBytes,
      urlStorage: chaveStorage,
    });

    await this.storage.putObject({
      body: arquivoValidado.buffer,
      contentType: arquivoValidado.mimeType,
      key: chaveStorage,
    });

    return {
      arquivo_id: arquivoPersistido.id,
    };
  }

  async garantirPertenceAoSalao(
    input: BuscarArquivoDoSalaoInput,
  ): Promise<void> {
    const arquivo = await this.arquivoRepository.buscarPorIdDoSalao(input);

    if (!arquivo) {
      throw new BadRequestException(
        'A imagem informada não pertence ao salão atual.',
      );
    }
  }

  async validarArquivoOpcionalDoSalao({
    arquivoId,
    salaoId,
  }: ValidarArquivoOpcionalDoSalaoInput): Promise<void> {
    if (!arquivoId) {
      return;
    }

    await this.garantirPertenceAoSalao({ id: arquivoId, salaoId });
  }

  obterObjeto(urlStorage: string): Promise<StorageObject> {
    return this.storage.getObject(urlStorage);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async limparOrfaosExpirados(): Promise<void> {
    const limite = new Date(Date.now() - DURACAO_RETENCAO_ARQUIVO_ORFAO_MS);
    const arquivos = await this.arquivoRepository.listarOrfaosExpirados(limite);

    for (const arquivo of arquivos) {
      await this.storage.deleteObject(arquivo.url_storage);
      await this.arquivoRepository.removerSeOrfao(arquivo.id);
    }
  }
}
