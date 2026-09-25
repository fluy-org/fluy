jest.mock('@fluy/schema', () => ({}));

import {
  toAgendamentosDaClienteResponse,
  toClienteFichaResponse,
} from '@/modules/cliente/cliente.mapper';
import type { ClientePersistido } from '@/modules/cliente/contracts';

describe('cliente.mapper', () => {
  const cliente: ClientePersistido = {
    id: 'cliente-ana',
    salao_id: 'salao-ana',
    nome: 'Ana',
    whatsapp: '11988887777',
    observacoes: null,
    criada_em: new Date('2026-09-01T12:00:00.000Z'),
    removido_em: new Date('2026-09-20T12:00:00.000Z'),
  };

  it('zera as métricas de cliente sem agendamentos', () => {
    expect(
      toClienteFichaResponse({
        cliente,
        fusoHorario: 'America/Sao_Paulo',
        metricas: {
          total_gasto: null,
          total_agendamentos: null,
          cancelamentos: null,
          faltas: null,
          ultimo_atendimento_em: null,
        },
      }),
    ).toEqual({
      id: 'cliente-ana',
      nome: 'Ana',
      whatsapp: '11988887777',
      observacoes: null,
      ativo: false,
      criada_em: '2026-09-01T12:00:00.000Z',
      fuso_horario: 'America/Sao_Paulo',
      metricas: {
        total_gasto: 0,
        total_agendamentos: 0,
        cancelamentos: 0,
        faltas: 0,
        ultimo_atendimento_em: null,
      },
    });
  });

  it('converte numeric e instantes das métricas', () => {
    const { metricas } = toClienteFichaResponse({
      cliente,
      fusoHorario: 'America/Sao_Paulo',
      metricas: {
        total_gasto: '250.50',
        total_agendamentos: 4,
        cancelamentos: 1,
        faltas: 1,
        ultimo_atendimento_em: new Date('2026-09-10T15:00:00.000Z'),
      },
    });

    expect(metricas.total_gasto).toBe(250.5);
    expect(metricas.ultimo_atendimento_em).toBe('2026-09-10T15:00:00.000Z');
  });

  it('converte o preço congelado dos itens do histórico', () => {
    const resposta = toAgendamentosDaClienteResponse({
      fusoHorario: 'America/Sao_Paulo',
      proximoCursor: null,
      itens: [
        {
          id: 'agendamento-ana',
          inicio_em: new Date('2026-09-10T15:00:00.000Z'),
          estado: 'concluido',
          preco_total: '120.00',
          procedimento: { id: 'procedimento-corte', nome: 'Corte' },
        },
      ],
    });

    expect(resposta.itens[0]).toEqual({
      id: 'agendamento-ana',
      inicio_em: '2026-09-10T15:00:00.000Z',
      estado: 'concluido',
      procedimento: { id: 'procedimento-corte', nome: 'Corte' },
      preco_total: 120,
    });
  });
});
