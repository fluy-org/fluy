import type {
  AtualizarProcedimentoDto,
  CriarProcedimentoDto,
} from '@fluy/schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  DadosSinalProcedimento,
  ValidarAtualizacaoProcedimentoInput,
} from './contracts';

@Injectable()
export class ProcedimentoValidator {
  validarCriacao(dados: CriarProcedimentoDto): CriarProcedimentoDto {
    const dadosNormalizados = { ...dados };

    if (dadosNormalizados.preco === 0) {
      dadosNormalizados.valor_sinal = 0;
    }

    this.validarSinal({
      preco: dadosNormalizados.preco,
      tipoSinal: dadosNormalizados.tipo_sinal,
      valorSinal: dadosNormalizados.valor_sinal,
    });

    return dadosNormalizados;
  }

  validarAtualizacao({
    dados,
    procedimento,
  }: ValidarAtualizacaoProcedimentoInput): AtualizarProcedimentoDto {
    const preco = dados.preco ?? Number(procedimento.preco);
    const tipoSinal = dados.tipo_sinal ?? procedimento.tipo_sinal;
    const valorSinal = dados.valor_sinal ?? Number(procedimento.valor_sinal);
    const dadosNormalizados = { ...dados };

    if (preco === 0) {
      dadosNormalizados.valor_sinal = 0;
    }

    this.validarSinal({
      preco,
      tipoSinal,
      valorSinal: dadosNormalizados.valor_sinal ?? valorSinal,
    });

    return dadosNormalizados;
  }

  private validarSinal({
    preco,
    tipoSinal,
    valorSinal,
  }: DadosSinalProcedimento) {
    if (tipoSinal === 'percentual' && valorSinal > 100) {
      throw new BadRequestException(
        'O sinal percentual deve ser de no máximo 100%.',
      );
    }

    if (tipoSinal === 'fixo' && valorSinal > preco) {
      throw new BadRequestException(
        'O sinal fixo não pode ser maior que o preço.',
      );
    }
  }
}
