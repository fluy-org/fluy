import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AtualizarSalaoConfiguracaoInput,
  SalaoConfiguracaoPersistida,
} from './contracts';
import { SalaoConfiguracaoRepository } from './salao-configuracao.repository';
import { SalaoConfiguracaoValidator } from './salao-configuracao.validator';

@Injectable()
export class SalaoConfiguracaoService {
  constructor(
    private readonly salaoConfiguracaoRepository: SalaoConfiguracaoRepository,
    private readonly salaoConfiguracaoValidator: SalaoConfiguracaoValidator,
  ) {}

  async buscar(salaoId: string): Promise<SalaoConfiguracaoPersistida> {
    const configuracao =
      await this.salaoConfiguracaoRepository.buscarPorSalaoId(salaoId);

    if (!configuracao) {
      throw new NotFoundException('Configuração do salão não encontrada.');
    }

    return configuracao;
  }

  async atualizar(
    input: AtualizarSalaoConfiguracaoInput,
  ): Promise<SalaoConfiguracaoPersistida> {
    const configuracao = await this.buscar(input.salaoId);

    const dados = this.salaoConfiguracaoValidator.validarAtualizacao({
      configuracao,
      dados: input.dados,
    });

    const configuracaoAtualizada =
      await this.salaoConfiguracaoRepository.atualizar({ ...input, dados });

    if (!configuracaoAtualizada) {
      throw new NotFoundException('Configuração do salão não encontrada.');
    }

    return configuracaoAtualizada;
  }
}
