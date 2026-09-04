jest.mock('@fluy/schema', () => ({ LIMITE_SUBDOMINIO: 63 }));

import {
  ehViolacaoUnicidade,
  gerarSugestaoSubdominio,
} from '@/modules/salao-onboarding/salao-onboarding-utils';

describe('salao-onboarding-utils', () => {
  it('identifica somente a violacao de unicidade do banco', () => {
    expect(ehViolacaoUnicidade({ code: '23505' })).toBe(true);
    expect(ehViolacaoUnicidade({ code: '23503' })).toBe(false);
    expect(ehViolacaoUnicidade(null)).toBe(false);
    expect(ehViolacaoUnicidade('23505')).toBe(false);
  });

  it('gera sugestao simples adicionando o sufixo numerico', () => {
    expect(gerarSugestaoSubdominio('salao-da-ana', 2)).toBe('salao-da-ana-2');
  });

  it('respeita o limite e remove hifens ao truncar a base', () => {
    const sugestao = gerarSugestaoSubdominio(`${'a'.repeat(61)}--`, 12);

    expect(sugestao).toHaveLength(63);
    expect(sugestao).toMatch(/[^-]-12$/);
  });
});
