import { BadRequestException } from '@nestjs/common';

jest.mock('@fluy/schema', () => ({}), { virtual: true });

import type { SalaoConfiguracaoPersistida } from './contracts';
import { SalaoConfiguracaoValidator } from './salao-configuracao.validator';

describe('SalaoConfiguracaoValidator', () => {
  const validator = new SalaoConfiguracaoValidator();

  it('aceita antecedência parcial coerente com a configuração atual', () => {
    const dados = { antecedencia_min_horas: 24 };

    expect(
      validator.validarAtualizacao({
        configuracao: criarConfiguracaoPersistida({
          antecedencia_max_dias: 1,
        }),
        dados,
      }),
    ).toBe(dados);
  });

  it('rejeita antecedência mínima maior que a máxima persistida', () => {
    expect(() =>
      validator.validarAtualizacao({
        configuracao: criarConfiguracaoPersistida({
          antecedencia_max_dias: 1,
        }),
        dados: { antecedencia_min_horas: 25 },
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita antecedência máxima menor que a mínima persistida', () => {
    expect(() =>
      validator.validarAtualizacao({
        configuracao: criarConfiguracaoPersistida({
          antecedencia_min_horas: 25,
        }),
        dados: { antecedencia_max_dias: 1 },
      }),
    ).toThrow(BadRequestException);
  });
});

function criarConfiguracaoPersistida(
  input: Partial<SalaoConfiguracaoPersistida> = {},
): SalaoConfiguracaoPersistida {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    granularidade_min: 30,
    prazo_reserva_min: 15,
    tolerancia_atraso_min: 15,
    antecedencia_min_horas: 2,
    antecedencia_max_dias: 60,
    mensagem_confirmacao: null,
    politica_atraso: null,
    ...input,
  };
}
