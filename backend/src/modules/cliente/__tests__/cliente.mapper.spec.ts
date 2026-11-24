jest.mock('@fluy/schema', () => ({}));

import {
  toAgendamentosDaClienteResponse,
  toClienteFichaResponse,
  toSessaoClientePublicaResponse,
} from '@/modules/cliente/cliente.mapper';
import type {
  ClientePersistido,
  SessaoClientePersistida,
} from '@/modules/cliente/contracts';

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
          duracao_min: 60,
          estado: 'concluido',
          preco_total: '120.00',
          valor_sinal: '30.00',
          procedimento: { id: 'procedimento-corte', nome: 'Corte' },
        },
      ],
    });

    expect(resposta.itens[0]).toEqual({
      id: 'agendamento-ana',
      inicio_em: '2026-09-10T15:00:00.000Z',
      duracao_min: 60,
      estado: 'concluido',
      procedimento: { id: 'procedimento-corte', nome: 'Corte' },
      preco_total: 120,
      valor_sinal: 30,
    });
  });

  describe('toSessaoClientePublicaResponse', () => {
    const sessaoBase: SessaoClientePersistida = {
      id: 'sessao-1',
      cliente_id: 'cliente-ana',
      credencial: 'cred-123',
      tipo: 'uuid_dispositivo',
      nome_informado: null,
      verificada_em: null,
      expira_em: new Date('2027-01-01T00:00:00.000Z'),
      revogada_em: null,
      ultimo_uso_em: null,
      criada_em: new Date('2026-09-01T12:00:00.000Z'),
    };

    it('retorna o nome cadastrado quando a sessão é verificada', () => {
      const sessao: SessaoClientePersistida = {
        ...sessaoBase,
        verificada_em: new Date('2026-09-01T12:00:00.000Z'),
        nome_informado: 'Nome Falso Digitado',
      };

      const res = toSessaoClientePublicaResponse({
        cliente,
        sessao,
        nomeExibicao: cliente.nome,
        verificada: true,
      });

      expect(res).toEqual({
        cliente: {
          nome: 'Ana',
          whatsapp: '11988887777',
          verificada: true,
        },
      });
    });

    it('NUNCA vaza o nome cadastrado quando a sessão NÃO é verificada', () => {
      const sessao: SessaoClientePersistida = {
        ...sessaoBase,
        verificada_em: null,
        nome_informado: 'Nome Informado no Dispositivo Novo',
      };

      const res = toSessaoClientePublicaResponse({
        cliente,
        sessao,
        nomeExibicao: sessao.nome_informado ?? cliente.nome,
        verificada: false,
      });

      expect(res).toEqual({
        cliente: {
          nome: 'Nome Informado no Dispositivo Novo',
          whatsapp: '11988887777',
          verificada: false,
        },
      });
      expect(res.cliente?.nome).not.toBe(cliente.nome);
    });
  });
});
