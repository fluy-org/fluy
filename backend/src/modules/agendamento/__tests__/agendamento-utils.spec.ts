jest.mock(
  '@fluy/schema',
  () => ({
    ACAO_AGENDAMENTO: ['concluir', 'cancelar', 'remarcar', 'marcar_falta'],
  }),
  { virtual: true },
);

import {
  calcularAcoesDoAgendamento,
  calcularValorPago,
  calcularValorPendente,
  contarAgendamentosPorDia,
} from '@/modules/agendamento/agendamento-utils';
import type {
  InstanteDeAgendamentoPersistido,
  PagamentoDoAgendamentoPersistido,
} from '@/modules/agendamento/contracts';

const INICIO_EM = new Date('2026-09-15T13:00:00.000Z');
const TOLERANCIA_MIN = 15;

describe('agendamento-utils', () => {
  describe('calcularValorPago', () => {
    it('devolve zero quando não há pagamento vinculado', () => {
      expect(calcularValorPago({ pagamentos: [] })).toBe('0.00');
    });

    it('conta a cobrança manual pela existência', () => {
      expect(
        calcularValorPago({
          pagamentos: [pagamentoManual('50.00')],
        }),
      ).toBe('50.00');
    });

    it('conta a cobrança de gateway apenas quando confirmada', () => {
      expect(
        calcularValorPago({
          pagamentos: [pagamentoGateway('50.00', 'confirmada')],
        }),
      ).toBe('50.00');
    });

    it('ignora a cobrança de gateway que ainda não confirmou', () => {
      expect(
        calcularValorPago({
          pagamentos: [
            pagamentoGateway('50.00', 'pendente'),
            pagamentoGateway('30.00', 'expirada'),
            pagamentoGateway('20.00', 'falhou'),
          ],
        }),
      ).toBe('0.00');
    });

    it('soma pagamentos confirmados de origens diferentes', () => {
      expect(
        calcularValorPago({
          pagamentos: [
            pagamentoGateway('50.00', 'confirmada'),
            pagamentoManual('49.90'),
            pagamentoGateway('10.00', 'pendente'),
          ],
        }),
      ).toBe('99.90');
    });

    it('soma centavos sem erro de ponto flutuante', () => {
      expect(
        calcularValorPago({
          pagamentos: [pagamentoManual('0.10'), pagamentoManual('0.20')],
        }),
      ).toBe('0.30');
    });
  });

  describe('calcularValorPendente', () => {
    it('devolve o preço total quando nada foi pago', () => {
      expect(
        calcularValorPendente({ precoTotal: '150.00', valorPago: '0.00' }),
      ).toBe('150.00');
    });

    it('desconta o valor já pago', () => {
      expect(
        calcularValorPendente({ precoTotal: '150.00', valorPago: '50.00' }),
      ).toBe('100.00');
    });

    it('devolve zero quando o pago cobre o total', () => {
      expect(
        calcularValorPendente({ precoTotal: '150.00', valorPago: '150.00' }),
      ).toBe('0.00');
    });

    it('nunca devolve valor negativo quando o pago supera o total', () => {
      expect(
        calcularValorPendente({ precoTotal: '150.00', valorPago: '200.00' }),
      ).toBe('0.00');
    });
  });

  describe('calcularAcoesDoAgendamento', () => {
    it('não permite nenhuma ação em reservado', () => {
      expect(acoesEm({ estado: 'reservado', agora: depoisDoInicio() })).toEqual(
        {
          acoesPermitidas: [],
          avisos: [],
        },
      );
    });

    it.each(['concluido', 'cancelado', 'falta'] as const)(
      'não permite nenhuma ação no estado terminal %s',
      (estado) => {
        expect(acoesEm({ estado, agora: depoisDoInicio() })).toEqual({
          acoesPermitidas: [],
          avisos: [],
        });
      },
    );

    it('bloqueia marcar_falta e avisa conclusão antecipada antes do início', () => {
      expect(acoesEm({ estado: 'agendado', agora: antesDoInicio() })).toEqual({
        acoesPermitidas: ['concluir', 'cancelar', 'remarcar'],
        avisos: ['conclusao_antecipada'],
      });
    });

    it('não avisa conclusão antecipada depois do início', () => {
      expect(
        acoesEm({ estado: 'agendado', agora: depoisDoInicio() }).avisos,
      ).not.toContain('conclusao_antecipada');
    });

    it('libera marcar_falta com aviso no exato instante do início', () => {
      expect(acoesEm({ estado: 'agendado', agora: INICIO_EM })).toEqual({
        acoesPermitidas: ['concluir', 'cancelar', 'remarcar', 'marcar_falta'],
        avisos: ['falta_antes_da_tolerancia'],
      });
    });

    it('mantém o aviso enquanto a tolerância não expirou', () => {
      expect(
        acoesEm({ estado: 'agendado', agora: minutosAposInicio(14) }),
      ).toEqual({
        acoesPermitidas: ['concluir', 'cancelar', 'remarcar', 'marcar_falta'],
        avisos: ['falta_antes_da_tolerancia'],
      });
    });

    it('remove o aviso quando a tolerância expira', () => {
      expect(
        acoesEm({ estado: 'agendado', agora: minutosAposInicio(15) }),
      ).toEqual({
        acoesPermitidas: ['concluir', 'cancelar', 'remarcar', 'marcar_falta'],
        avisos: [],
      });
    });
  });

  describe('contarAgendamentosPorDia', () => {
    const FUSO_SAO_PAULO = 'America/Sao_Paulo';

    it('devolve lista vazia quando não há agendamento no período', () => {
      expect(
        contarAgendamentosPorDia({
          instantes: [],
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([]);
    });

    it('conta pelo dia civil do salão, e não pelo dia UTC', () => {
      // 22h em São Paulo já é o dia seguinte em UTC: o agendamento tem de cair
      // no dia civil do salão.
      expect(
        contarAgendamentosPorDia({
          instantes: [instante('2026-09-16T01:00:00.000Z')],
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([{ data: '2026-09-15', total: 1 }]);
    });

    it('conta a meia-noite do salão no dia que começa', () => {
      expect(
        contarAgendamentosPorDia({
          instantes: [instante('2026-09-15T03:00:00.000Z')],
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([{ data: '2026-09-15', total: 1 }]);
    });

    it('soma os agendamentos do mesmo dia civil', () => {
      expect(
        contarAgendamentosPorDia({
          instantes: [
            instante('2026-09-15T12:00:00.000Z'),
            instante('2026-09-15T14:00:00.000Z'),
            instante('2026-09-16T01:00:00.000Z'),
          ],
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([{ data: '2026-09-15', total: 3 }]);
    });

    it('devolve os dias em ordem crescente e omite dia sem agendamento', () => {
      expect(
        contarAgendamentosPorDia({
          instantes: [
            instante('2026-09-17T12:00:00.000Z'),
            instante('2026-09-15T12:00:00.000Z'),
            instante('2026-09-17T15:00:00.000Z'),
          ],
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([
        { data: '2026-09-15', total: 1 },
        { data: '2026-09-17', total: 2 },
      ]);
    });

    it('respeita o fuso informado ao decidir o dia civil', () => {
      const mesmoInstante = [instante('2026-09-16T01:00:00.000Z')];

      expect(
        contarAgendamentosPorDia({
          instantes: mesmoInstante,
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual([{ data: '2026-09-15', total: 1 }]);
      expect(
        contarAgendamentosPorDia({
          instantes: mesmoInstante,
          fusoHorario: 'America/Noronha',
        }),
      ).toEqual([{ data: '2026-09-15', total: 1 }]);
      expect(
        contarAgendamentosPorDia({
          instantes: mesmoInstante,
          fusoHorario: 'UTC',
        }),
      ).toEqual([{ data: '2026-09-16', total: 1 }]);
    });
  });
});

function instante(isoUtc: string): InstanteDeAgendamentoPersistido {
  return { inicio_em: new Date(isoUtc) };
}

function acoesEm({
  estado,
  agora,
}: {
  estado: 'reservado' | 'agendado' | 'concluido' | 'cancelado' | 'falta';
  agora: Date;
}) {
  return calcularAcoesDoAgendamento({
    estado,
    inicioEm: INICIO_EM,
    toleranciaAtrasoMin: TOLERANCIA_MIN,
    agora,
  });
}

function minutosAposInicio(minutos: number): Date {
  return new Date(INICIO_EM.getTime() + minutos * 60 * 1_000);
}

function antesDoInicio(): Date {
  return new Date(INICIO_EM.getTime() - 1);
}

function depoisDoInicio(): Date {
  return minutosAposInicio(60);
}

function pagamentoManual(valor: string): PagamentoDoAgendamentoPersistido {
  return { valor, status: null };
}

function pagamentoGateway(
  valor: string,
  status: 'pendente' | 'confirmada' | 'expirada' | 'falhou',
): PagamentoDoAgendamentoPersistido {
  return { valor, status };
}
