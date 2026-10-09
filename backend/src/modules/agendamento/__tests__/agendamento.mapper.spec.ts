import { toAgendamentoPublicoDetalheResponse } from '@/modules/agendamento/agendamento.mapper';
import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';

describe('AgendamentoMapper', () => {
  it('nao expoe anexos internos no detalhe publico', () => {
    const resposta = toAgendamentoPublicoDetalheResponse(
      criarAgendamentoDetalhe(),
    );

    expect(resposta).not.toHaveProperty('quantidade_anexos');
    expect(resposta).not.toHaveProperty('anexos');
  });
});

function criarAgendamentoDetalhe(): AgendamentoDetalheResultado {
  return {
    id: 'b94a24a5-5036-43ba-af8a-f2128fd63bed',
    salao_id: '46df3565-f773-4744-aa61-c84950ed37ba',
    profissional_id: '3330fa1b-a83c-4f9d-8517-2779cf271a26',
    cliente_id: 'f8fd9eae-8ea2-4df5-a321-e46621b28a4d',
    procedimento_id: '413f4c24-2308-464f-93c8-67557267d6e0',
    inicio_em: new Date('2026-10-06T12:00:00.000Z'),
    duracao_min: 60,
    preco_total: '100.00',
    valor_sinal: '0.00',
    estado: 'agendado',
    expira_em: null,
    criado_em: new Date('2026-10-01T12:00:00.000Z'),
    cliente: {
      id: 'f8fd9eae-8ea2-4df5-a321-e46621b28a4d',
      nome: 'Cliente',
      whatsapp: '11999999999',
    },
    procedimento: {
      id: '413f4c24-2308-464f-93c8-67557267d6e0',
      nome: 'Procedimento',
      periodo_manutencao_dias: null,
    },
    pagamentos: [],
    quantidade_anexos: 2,
    tem_imagens_referencia: true,
    tem_observacoes: false,
    valorPago: '0.00',
    valorPendente: '100.00',
    acoesPermitidas: [],
    avisos: [],
    fusoHorario: 'America/Sao_Paulo',
    remarcado_vezes: 0,
  };
}
