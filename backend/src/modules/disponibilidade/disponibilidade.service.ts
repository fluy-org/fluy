import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AtualizarDisponibilidadeSemanalInput,
  AtualizarOverrideDisponibilidadeInput,
  BuscarProfissionalInput,
  ListarOverridesDisponibilidadeInput,
  RemoverOverrideDisponibilidadeInput,
} from '@/modules/disponibilidade/contracts';
import { DisponibilidadeRepository } from '@/modules/disponibilidade/disponibilidade.repository';
import { DisponibilidadeValidator } from '@/modules/disponibilidade/disponibilidade.validator';

@Injectable()
export class DisponibilidadeService {
  constructor(
    private readonly disponibilidadeRepository: DisponibilidadeRepository,
    private readonly disponibilidadeValidator: DisponibilidadeValidator,
  ) {}

  listarProfissionais(salaoId: string) {
    return this.disponibilidadeRepository.listarProfissionais(salaoId);
  }

  async buscarJanelasSemanais(input: BuscarProfissionalInput) {
    await this.buscarProfissionalDoSalao(input);

    return this.disponibilidadeRepository.listarJanelasSemanais(
      input.profissionalId,
    );
  }

  async atualizarJanelasSemanais(
    input: AtualizarDisponibilidadeSemanalInput,
  ) {
    await this.buscarProfissionalDoSalao(input);

    const dados = this.disponibilidadeValidator.validarAtualizacaoSemanal(
      input.dados,
    );

    return this.disponibilidadeRepository.substituirJanelasSemanais({
      ...input,
      dados,
    });
  }

  async listarOverrides(input: ListarOverridesDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    return this.disponibilidadeRepository.listarOverrides(input);
  }

  async atualizarOverride(input: AtualizarOverrideDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    const dados = this.disponibilidadeValidator.validarAtualizacaoOverride(
      input.dados,
    );
    const data = this.disponibilidadeValidator.validarData(input.data);

    return this.disponibilidadeRepository.substituirOverride({
      ...input,
      dados,
      data,
    });
  }

  async removerOverride(input: RemoverOverrideDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    await this.disponibilidadeRepository.removerOverride({
      ...input,
      data: this.disponibilidadeValidator.validarData(input.data),
    });
  }

  private async buscarProfissionalDoSalao(input: BuscarProfissionalInput) {
    const profissional =
      await this.disponibilidadeRepository.buscarProfissional(input);

    if (!profissional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return profissional;
  }
}
