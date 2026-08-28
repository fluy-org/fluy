import { BadRequestException } from '@nestjs/common';
import type { ProcedimentoPersistido } from './contracts';
import { ProcedimentoValidator } from './procedimento.validator';

describe('ProcedimentoValidator', () => {
  const validator = new ProcedimentoValidator();

  it('normaliza o sinal para zero em procedimento de cortesia', () => {
    const dados = validator.validarCriacao({
      nome: 'Cortesia',
      duracao_min: 30,
      preco: 0,
      tipo_sinal: 'fixo',
      valor_sinal: 20,
    });

    expect(dados.valor_sinal).toBe(0);
  });

  it('rejeita preço menor que o sinal fixo já cadastrado', () => {
    expect(() =>
      validator.validarAtualizacao({
        dados: { preco: 20 },
        procedimento: criarProcedimentoPersistido({ valor_sinal: '50.00' }),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita sinal acima de 100% ao trocar o tipo do sinal', () => {
    expect(() =>
      validator.validarAtualizacao({
        dados: { tipo_sinal: 'percentual' },
        procedimento: criarProcedimentoPersistido({ valor_sinal: '120.00' }),
      }),
    ).toThrow(BadRequestException);
  });

  it('normaliza o sinal existente ao zerar o preço parcialmente', () => {
    const dados = validator.validarAtualizacao({
      dados: { preco: 0 },
      procedimento: criarProcedimentoPersistido({ valor_sinal: '20.00' }),
    });

    expect(dados).toEqual({ preco: 0, valor_sinal: 0 });
  });
});

function criarProcedimentoPersistido(
  input: Partial<ProcedimentoPersistido> = {},
): ProcedimentoPersistido {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: 'fb2e97ce-7db2-4456-8dfd-0a0b66c6c3a8',
    nome: 'Corte',
    descricao: null,
    info_pre_procedimento: null,
    duracao_min: 30,
    preco: '100.00',
    tipo_sinal: 'fixo',
    valor_sinal: '20.00',
    periodo_manutencao_dias: null,
    ativo: true,
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
    ...input,
  };
}
