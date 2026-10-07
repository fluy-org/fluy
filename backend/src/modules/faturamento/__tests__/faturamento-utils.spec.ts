import type {
  EncerramentoPersistido,
  PagamentoDoEncerramentoPersistido,
} from '@/modules/faturamento/contracts';
import {
  calcularFaturamento,
  converterPeriodoEmIntervalo,
  montarAtendimentoFaturamento,
  resolverPeriodo,
} from '@/modules/faturamento/faturamento-utils';

describe('faturamento-utils', () => {
  describe('resolverPeriodo', () => {
    // 2026-10-07 é uma quarta-feira.
    const hoje = '2026-10-07';

    it('devolve o intervalo customizado como veio', () => {
      expect(
        resolverPeriodo({
          dados: { data_inicio: '2026-09-03', data_fim: '2026-09-20' },
          hoje,
        }),
      ).toEqual({ dataInicio: '2026-09-03', dataFim: '2026-09-20' });
    });

    it.each([
      ['semana_atual', '2026-10-05', '2026-10-11'],
      ['semana_anterior', '2026-09-28', '2026-10-04'],
      ['mes_atual', '2026-10-01', '2026-10-31'],
      ['mes_anterior', '2026-09-01', '2026-09-30'],
      ['quinzena_atual', '2026-10-01', '2026-10-15'],
    ] as const)(
      'resolve %s de segunda a domingo e por mês civil',
      (periodo, inicio, fim) => {
        expect(resolverPeriodo({ dados: { periodo }, hoje })).toEqual({
          dataInicio: inicio,
          dataFim: fim,
        });
      },
    );

    it('trata domingo como o último dia da semana', () => {
      expect(
        resolverPeriodo({
          dados: { periodo: 'semana_atual' },
          hoje: '2026-10-11',
        }),
      ).toEqual({ dataInicio: '2026-10-05', dataFim: '2026-10-11' });
    });

    it('usa a segunda quinzena a partir do dia 16, até o último dia do mês', () => {
      expect(
        resolverPeriodo({
          dados: { periodo: 'quinzena_atual' },
          hoje: '2028-02-16',
        }),
      ).toEqual({ dataInicio: '2028-02-16', dataFim: '2028-02-29' });
    });

    it('volta para dezembro do ano anterior no mês anterior de janeiro', () => {
      expect(
        resolverPeriodo({
          dados: { periodo: 'mes_anterior' },
          hoje: '2027-01-10',
        }),
      ).toEqual({ dataInicio: '2026-12-01', dataFim: '2026-12-31' });
    });
  });

  describe('converterPeriodoEmIntervalo', () => {
    it('fecha o período na meia-noite do fuso do salão, com fim exclusivo', () => {
      expect(
        converterPeriodoEmIntervalo({
          periodo: { dataInicio: '2026-10-01', dataFim: '2026-10-31' },
          fusoHorario: 'America/Sao_Paulo',
        }),
      ).toEqual({
        inicio: new Date('2026-10-01T03:00:00.000Z'),
        fim: new Date('2026-11-01T03:00:00.000Z'),
      });
    });

    it('coloca no mês certo o evento perto da virada no fuso do salão', () => {
      const { inicio, fim } = converterPeriodoEmIntervalo({
        periodo: { dataInicio: '2026-10-01', dataFim: '2026-10-31' },
        fusoHorario: 'America/Sao_Paulo',
      });
      // 31/10 às 23:30 em São Paulo já é 01/11 em UTC, mas é outubro no salão.
      const ultimaNoiteDeOutubro = new Date('2026-11-01T02:30:00.000Z');
      // 01/10 às 00:10 em UTC ainda é 30/09 em São Paulo.
      const virandoSetembro = new Date('2026-10-01T00:10:00.000Z');

      expect(ultimaNoiteDeOutubro >= inicio && ultimaNoiteDeOutubro < fim).toBe(
        true,
      );
      expect(virandoSetembro >= inicio && virandoSetembro < fim).toBe(false);
    });
  });

  describe('calcularFaturamento', () => {
    it('soma concluídos e sinais retidos no total faturado', () => {
      const { resumo, sinaisRetidos } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({
            tipo: 'concluido',
            pagamentos: [
              criarPagamento({
                tipo: 'sinal',
                origem: 'gateway',
                metodo: 'pix',
                valor_centavos: 3000,
              }),
              criarPagamento({
                tipo: 'restante',
                metodo: 'dinheiro',
                valor_centavos: 7000,
              }),
            ],
          }),
          criarEncerramento({
            agendamento_id: 'agendamento-falta',
            tipo: 'falta',
            pagamentos: [
              criarPagamento({ tipo: 'sinal', valor_centavos: 2500 }),
            ],
          }),
        ],
      });

      expect(resumo.total_faturado_centavos).toBe(12500);
      expect(resumo.total_concluidos).toBe(1);
      expect(sinaisRetidos).toHaveLength(1);
    });

    it('calcula o ticket médio só com o recebido dos concluídos', () => {
      const { resumo } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({
            pagamentos: [criarPagamento({ valor_centavos: 10000 })],
          }),
          criarEncerramento({
            agendamento_id: 'agendamento-2',
            pagamentos: [criarPagamento({ valor_centavos: 5000 })],
            preco_total_centavos: 5000,
          }),
          criarEncerramento({
            agendamento_id: 'agendamento-falta',
            tipo: 'falta',
            pagamentos: [
              criarPagamento({ tipo: 'sinal', valor_centavos: 9000 }),
            ],
          }),
        ],
      });

      expect(resumo.ticket_medio_centavos).toBe(7500);
    });

    it('devolve ticket médio nulo e zeros em período sem movimento', () => {
      expect(calcularFaturamento({ encerramentos: [] })).toEqual({
        resumo: {
          total_faturado_centavos: 0,
          total_concluidos: 0,
          ticket_medio_centavos: null,
          total_pendentes: 0,
        },
        recebimentoPorMetodo: [],
        sinaisRetidos: [],
      });
    });

    it('em período só com retidos, o total vem só dos sinais retidos', () => {
      const { resumo } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({
            tipo: 'cancelado',
            cancelado_por: 'cliente',
            pagamentos: [
              criarPagamento({ tipo: 'sinal', valor_centavos: 4000 }),
            ],
          }),
        ],
      });

      expect(resumo.total_faturado_centavos).toBe(4000);
      expect(resumo.ticket_medio_centavos).toBeNull();
    });

    it('retém o sinal no no-show com o motivo falta', () => {
      const { sinaisRetidos } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({
            tipo: 'falta',
            pagamentos: [
              criarPagamento({ tipo: 'sinal', valor_centavos: 3000 }),
            ],
          }),
        ],
      });

      expect(sinaisRetidos).toEqual([
        expect.objectContaining({ valor_centavos: 3000, motivo: 'falta' }),
      ]);
    });

    it.each([
      ['cliente', 'cancelamento_cliente'],
      ['salao', 'cancelamento_salao'],
    ] as const)(
      'retém o sinal no cancelamento feito por %s com o motivo certo',
      (canceladoPor, motivo) => {
        const { sinaisRetidos } = calcularFaturamento({
          encerramentos: [
            criarEncerramento({
              tipo: 'cancelado',
              cancelado_por: canceladoPor,
              pagamentos: [
                criarPagamento({ tipo: 'sinal', valor_centavos: 3000 }),
              ],
            }),
          ],
        });

        expect(sinaisRetidos).toEqual([
          expect.objectContaining({ valor_centavos: 3000, motivo }),
        ]);
      },
    );

    it('não lista encerramento sem valor retido', () => {
      const { sinaisRetidos, resumo } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({ tipo: 'falta', pagamentos: [] }),
          criarEncerramento({
            agendamento_id: 'agendamento-gateway-pendente',
            tipo: 'cancelado',
            cancelado_por: 'salao',
            pagamentos: [
              criarPagamento({
                tipo: 'sinal',
                origem: 'gateway',
                metodo: 'pix',
                valor_centavos: 0,
              }),
            ],
          }),
        ],
      });

      expect(sinaisRetidos).toEqual([]);
      expect(resumo.total_faturado_centavos).toBe(0);
    });

    it('conta como pendente o concluído sem método do restante registrado', () => {
      const { resumo } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({ preco_total_centavos: 10000, pagamentos: [] }),
          criarEncerramento({
            agendamento_id: 'agendamento-quitado',
            preco_total_centavos: 10000,
            pagamentos: [criarPagamento({ valor_centavos: 10000 })],
          }),
        ],
      });

      expect(resumo.total_pendentes).toBe(1);
      expect(resumo.total_faturado_centavos).toBe(10000);
    });

    it('agrega o recebido por método, incluindo os sinais retidos', () => {
      const { recebimentoPorMetodo } = calcularFaturamento({
        encerramentos: [
          criarEncerramento({
            pagamentos: [
              criarPagamento({
                tipo: 'sinal',
                origem: 'gateway',
                metodo: 'pix',
                valor_centavos: 3000,
              }),
              criarPagamento({ metodo: 'dinheiro', valor_centavos: 7000 }),
            ],
          }),
          criarEncerramento({
            agendamento_id: 'agendamento-2',
            pagamentos: [
              criarPagamento({ metodo: 'dinheiro', valor_centavos: 5000 }),
            ],
          }),
          criarEncerramento({
            agendamento_id: 'agendamento-falta',
            tipo: 'falta',
            pagamentos: [
              criarPagamento({
                tipo: 'sinal',
                origem: 'gateway',
                metodo: 'pix',
                valor_centavos: 2000,
              }),
            ],
          }),
        ],
      });

      expect(recebimentoPorMetodo).toEqual([
        { origem: 'manual', metodo: 'dinheiro', valor_centavos: 12000 },
        { origem: 'gateway', metodo: 'pix', valor_centavos: 5000 },
      ]);
    });
  });

  describe('montarAtendimentoFaturamento', () => {
    it('separa sinal e restante pelo tipo do pagamento', () => {
      const atendimento = montarAtendimentoFaturamento(
        criarEncerramento({
          preco_total_centavos: 10000,
          pagamentos: [
            criarPagamento({
              tipo: 'sinal',
              origem: 'gateway',
              metodo: 'pix',
              valor_centavos: 3000,
            }),
            criarPagamento({
              tipo: 'restante',
              metodo: 'cartao_maquina',
              valor_centavos: 7000,
            }),
          ],
        }),
      );

      expect(atendimento).toEqual(
        expect.objectContaining({
          valor_total_centavos: 10000,
          sinal: { origem: 'gateway', metodo: 'pix', valor_centavos: 3000 },
          restante: {
            origem: 'manual',
            metodo: 'cartao_maquina',
            valor_centavos: 7000,
          },
          valor_pendente_centavos: 0,
        }),
      );
    });

    it('deixa o restante vazio e o valor pendente quando a cliente não pagou', () => {
      const atendimento = montarAtendimentoFaturamento(
        criarEncerramento({ preco_total_centavos: 10000, pagamentos: [] }),
      );

      expect(atendimento.sinal).toBeNull();
      expect(atendimento.restante).toBeNull();
      expect(atendimento.valor_pendente_centavos).toBe(10000);
    });
  });
});

function criarEncerramento(
  sobrescritas: Partial<EncerramentoPersistido> = {},
): EncerramentoPersistido {
  return {
    agendamento_id: 'agendamento-1',
    tipo: 'concluido',
    ocorreu_em: new Date('2026-10-07T15:00:00.000Z'),
    cancelado_por: null,
    preco_total_centavos: 10000,
    cliente: { id: 'cliente-ana', nome: 'Ana' },
    procedimento: { id: 'procedimento-corte', nome: 'Corte' },
    pagamentos: [],
    ...sobrescritas,
  };
}

function criarPagamento(
  sobrescritas: Partial<PagamentoDoEncerramentoPersistido> = {},
): PagamentoDoEncerramentoPersistido {
  return {
    tipo: 'restante',
    origem: 'manual',
    metodo: 'dinheiro',
    valor_centavos: 10000,
    ...sobrescritas,
  };
}
