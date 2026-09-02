import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AtualizarProcedimentoInput,
  BuscarProcedimentoInput,
  CriarProcedimentoInput,
  ProcedimentoPersistido,
} from '@/modules/procedimento/contracts';
import { ProcedimentoRepository } from '@/modules/procedimento/procedimento.repository';
import { ProcedimentoValidator } from '@/modules/procedimento/procedimento.validator';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';

@Injectable()
export class ProcedimentoService {
  constructor(
    private readonly procedimentoRepository: ProcedimentoRepository,
    private readonly procedimentoValidator: ProcedimentoValidator,
    private readonly arquivoService: ArquivoService,
  ) {}

  async criar(input: CriarProcedimentoInput) {
    const dados = this.procedimentoValidator.validarCriacao(input.dados);

    await this.arquivoService.validarArquivoOpcionalDoSalao({
      arquivoId: dados.imagem?.arquivo_id,
      salaoId: input.salaoId,
    });

    try {
      return await this.procedimentoRepository.criar({ ...input, dados });
    } catch (error) {
      this.rethrowImageFileConflict(error);
    }
  }

  listar(salaoId: string) {
    return this.procedimentoRepository.listar(salaoId);
  }

  listarAtivos(salaoId: string) {
    return this.procedimentoRepository.listarAtivos(salaoId);
  }

  async atualizar(
    input: AtualizarProcedimentoInput,
  ): Promise<ProcedimentoPersistido> {
    const procedimento = await this.procedimentoRepository.buscarPorId(input);

    if (!procedimento) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    const dados = this.procedimentoValidator.validarAtualizacao({
      dados: input.dados,
      procedimento,
    });
    await this.arquivoService.validarArquivoOpcionalDoSalao({
      arquivoId: dados.imagem?.arquivo_id,
      salaoId: input.salaoId,
    });

    let procedimentoAtualizado: ProcedimentoPersistido | undefined;

    try {
      procedimentoAtualizado = await this.procedimentoRepository.atualizar({
        ...input,
        dados,
        imagemExistente: procedimento.imagem,
      });
    } catch (error) {
      this.rethrowImageFileConflict(error);
    }

    if (!procedimentoAtualizado) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    return procedimentoAtualizado;
  }

  async desativar(input: BuscarProcedimentoInput) {
    const procedimento = await this.procedimentoRepository.buscarPorId(input);

    if (!procedimento) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    const procedimentoDesativado = await this.procedimentoRepository.desativar({
      ...input,
      imagemExistente: procedimento.imagem,
    });

    if (!procedimentoDesativado) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    return procedimentoDesativado;
  }

  async removerImagem(input: BuscarProcedimentoInput): Promise<void> {
    const procedimento = await this.procedimentoRepository.buscarPorId(input);

    if (!procedimento) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    await this.procedimentoRepository.removerImagem(input);
  }

  async obterImagemPublica(input: BuscarProcedimentoInput) {
    const arquivo =
      await this.procedimentoRepository.buscarArquivoDaImagem(input);

    if (!arquivo) {
      throw new NotFoundException('Imagem do procedimento não encontrada.');
    }

    return {
      arquivo,
      objeto: await this.arquivoService.obterObjeto(arquivo.url_storage),
    };
  }

  private rethrowImageFileConflict(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: unknown }).code === '23505' &&
      (error as { constraint?: unknown }).constraint ===
        'imagem_procedimento_arquivo_id_unique'
    ) {
      throw new ConflictException(
        'Este arquivo ja esta vinculado a outro procedimento.',
      );
    }

    throw error;
  }
}
