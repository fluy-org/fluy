jest.mock(
  '@fluy/schema',
  () => ({
    agendamento: { estado: 'agendamento.estado' },
    cobrancaManual: { valor: 'cobranca_manual.valor' },
    cobrancaGateway: {
      valor: 'cobranca_gateway.valor',
      status: 'cobranca_gateway.status',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  inArray: jest.fn(() => 'filtro-estados'),
  sql: jest.fn(() => 'valor-recebido'),
}));

import { inArray, sql } from 'drizzle-orm';
import { agendamento } from '@fluy/schema';
import {
  montarFiltroEstadosComRecebimento,
  montarValorRecebido,
} from '@/shared/recebimento/recebimento.utils';

describe('recebimento.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('conta só agendamentos concluídos ou com sinal retido', () => {
    expect(montarFiltroEstadosComRecebimento()).toBe('filtro-estados');
    expect(inArray).toHaveBeenCalledWith(agendamento.estado, [
      'concluido',
      'cancelado',
      'falta',
    ]);
  });

  it('soma cobrança manual sempre e de gateway só quando confirmada', () => {
    montarValorRecebido();

    const [partes, ...valores] = jest.mocked(sql).mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];

    expect(valores).toEqual([
      'cobranca_manual.valor',
      'cobranca_gateway.status',
      'cobranca_gateway.valor',
    ]);
    expect(partes.join('?')).toContain("= 'confirmada'");
  });
});
