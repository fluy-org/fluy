import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AtualizarProcedimentoInput,
  BuscarProcedimentoInput,
  CriarProcedimentoInput,
  ProcedimentoPersistido,
} from './contracts';
import { ProcedimentoRepository } from './procedimento.repository';
import { ProcedimentoValidator } from './procedimento.validator';

@Injectable()
export class ProcedimentoService {
  constructor(
    private readonly procedimentoRepository: ProcedimentoRepository,
    private readonly procedimentoValidator: ProcedimentoValidator,
  ) {}

  criar(input: CriarProcedimentoInput): Promise<ProcedimentoPersistido> {
    const dados = this.procedimentoValidator.validarCriacao(input.dados);

    return this.procedimentoRepository.criar({ ...input, dados });
  }

  listar(salaoId: string): Promise<ProcedimentoPersistido[]> {
    return this.procedimentoRepository.listar(salaoId);
  }

  listarAtivos(salaoId: string): Promise<ProcedimentoPersistido[]> {
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

    const procedimentoAtualizado = await this.procedimentoRepository.atualizar({
      ...input,
      dados,
    });

    if (!procedimentoAtualizado) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    return procedimentoAtualizado;
  }

  async desativar(
    input: BuscarProcedimentoInput,
  ): Promise<ProcedimentoPersistido> {
    const procedimento = await this.procedimentoRepository.desativar(input);

    if (!procedimento) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    return procedimento;
  }
}
