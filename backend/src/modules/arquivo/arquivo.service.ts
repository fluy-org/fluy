import { randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import sharp from 'sharp';
import type {
  BuscarArquivoDoSalaoInput,
  EnviarArquivoInput,
  ArquivoValidado,
  ValidarArquivoOpcionalDoSalaoInput,
} from '@/modules/arquivo/contracts';
import { DURACAO_RETENCAO_ARQUIVO_ORFAO_MS } from '@/modules/arquivo/contracts';
import {
  CONFIGURACOES_COMPRESSAO_IMAGEM,
  LADO_MAXIMO_IMAGEM_PX,
  LIMITE_MAXIMO_PIXELS_IMAGEM,
  LIMITE_TAMANHO_ARQUIVO_PROCESSADO_MIB,
  TAMANHO_MAXIMO_ARQUIVO_PROCESSADO_BYTES,
} from '@/modules/arquivo/arquivo-data';
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
    const arquivoProcessado = await this.comprimirImagem(arquivoValidado);
    const chaveStorage = randomUUID();
    const arquivoPersistido = await this.arquivoRepository.criar({
      mimeType: arquivoProcessado.mimeType,
      salaoId,
      tamanhoBytes: arquivoProcessado.tamanhoBytes,
      urlStorage: chaveStorage,
    });

    await this.storage.putObject({
      body: arquivoProcessado.buffer,
      contentType: arquivoProcessado.mimeType,
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

  private async comprimirImagem(
    arquivo: ArquivoValidado,
  ): Promise<ArquivoValidado> {
    try {
      const imagem = sharp(arquivo.buffer, {
        limitInputPixels: LIMITE_MAXIMO_PIXELS_IMAGEM,
      })
        .autoOrient()
        .resize({
          width: LADO_MAXIMO_IMAGEM_PX,
          height: LADO_MAXIMO_IMAGEM_PX,
          fit: 'inside',
          withoutEnlargement: true,
        });

      const configuracao = CONFIGURACOES_COMPRESSAO_IMAGEM[arquivo.mimeType];

      const buffer = await imagem
        .toFormat(configuracao.formato, configuracao.opcoes)
        .toBuffer();

      if (buffer.byteLength > TAMANHO_MAXIMO_ARQUIVO_PROCESSADO_BYTES) {
        throw new BadRequestException(
          `A imagem processada deve ter no maximo ${LIMITE_TAMANHO_ARQUIVO_PROCESSADO_MIB} MiB.`,
        );
      }

      return {
        buffer,
        mimeType: arquivo.mimeType,
        tamanhoBytes: buffer.byteLength,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Nao foi possivel processar a imagem.');
    }
  }
}
