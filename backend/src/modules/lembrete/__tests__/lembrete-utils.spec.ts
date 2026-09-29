jest.mock('@fluy/schema', () => ({}));

import { calcularJanelaDoPeriodo } from '@/modules/lembrete/lembrete-utils';

describe('calcularJanelaDoPeriodo', () => {
  const hoje = '2026-06-10';

  it('hoje cobre só o dia atual', () => {
    expect(calcularJanelaDoPeriodo({ periodo: 'hoje', hoje })).toEqual({
      inicio: '2026-06-10',
      fim: '2026-06-10',
    });
  });

  it('semana cobre os próximos sete dias a partir de hoje', () => {
    expect(calcularJanelaDoPeriodo({ periodo: 'semana', hoje })).toEqual({
      inicio: '2026-06-10',
      fim: '2026-06-16',
    });
  });

  it('mês cobre os próximos trinta dias a partir de hoje', () => {
    expect(calcularJanelaDoPeriodo({ periodo: 'mes', hoje })).toEqual({
      inicio: '2026-06-10',
      fim: '2026-07-09',
    });
  });

  it('atrasados termina ontem, sem incluir hoje', () => {
    expect(calcularJanelaDoPeriodo({ periodo: 'atrasados', hoje })).toEqual({
      fim: '2026-06-09',
    });
  });

  it('sem período não restringe a data alvo', () => {
    expect(calcularJanelaDoPeriodo({ periodo: undefined, hoje })).toEqual({});
  });
});
