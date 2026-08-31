import type { AtualizarConfiguracaoSalaoDto } from '@fluy/schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { ValidarAtualizacaoSalaoConfiguracaoInput } from '@/modules/salao-configuracao/contracts';

@Injectable()
export class SalaoConfiguracaoValidator {
  validarAtualizacao({
    configuracao,
    dados,
  }: ValidarAtualizacaoSalaoConfiguracaoInput): AtualizarConfiguracaoSalaoDto {
    const antecedenciaMaxDias =
      dados.antecedencia_max_dias ?? configuracao.antecedencia_max_dias;
    const antecedenciaMinHoras =
      dados.antecedencia_min_horas ?? configuracao.antecedencia_min_horas;

    if (antecedenciaMinHoras > antecedenciaMaxDias * 24) {
      throw new BadRequestException(
        'A antecedência mínima não pode ser maior que a antecedência máxima.',
      );
    }

    return dados;
  }
}
