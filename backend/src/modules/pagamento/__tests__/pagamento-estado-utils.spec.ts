import {
  decidirNotificacao,
  normalizarTipoEvento,
} from '@/modules/pagamento/pagamento-estado-utils';

describe('decidirNotificacao', () => {
  it('distingue expiração de falha no evento persistido', () => {
    expect(normalizarTipoEvento('expirado')).toBe('expirada');
    expect(normalizarTipoEvento('falhou')).toBe('falhou');
    expect(normalizarTipoEvento('confirmado')).toBe('cobranca_confirmada');
  });
  const base = {
    estadoReserva: 'reservado' as const,
    expiraEm: new Date('2030-01-01T00:15:00.000Z'),
    agora: new Date('2030-01-01T00:10:00.000Z'),
    statusCobranca: 'pendente' as const,
    modalidade: 'total' as const,
    valorSalaoCentavos: 10000,
    valorSinalCentavos: 3000,
    totalClienteCentavos: 10100,
  };

  it('confirma valor total e promove a reserva com duas alocações', () => {
    expect(
      decidirNotificacao({
        ...base,
        tipo: 'confirmado',
        valorPagoCentavos: 10100,
      }),
    ).toEqual({
      novoStatus: 'confirmada',
      promoverReserva: true,
      divergencia: false,
      alocacoes: [
        { tipo: 'sinal', valorCentavos: 3000 },
        { tipo: 'restante', valorCentavos: 7000 },
      ],
    });
  });

  it('promove a reserva quando ocorridoEm é antes de expiraEm mesmo que agora seja posterior (processamento atrasado)', () => {
    expect(
      decidirNotificacao({
        ...base,
        estadoReserva: 'reservado',
        expiraEm: new Date('2030-01-01T00:15:00.000Z'),
        ocorridoEm: new Date('2030-01-01T00:14:00.000Z'),
        agora: new Date('2030-01-01T00:25:00.000Z'), // webhook atrasado 10 min
        tipo: 'confirmado',
        valorPagoCentavos: 10100,
      }),
    ).toEqual({
      novoStatus: 'confirmada',
      promoverReserva: true,
      divergencia: false,
      alocacoes: [
        { tipo: 'sinal', valorCentavos: 3000 },
        { tipo: 'restante', valorCentavos: 7000 },
      ],
    });
  });

  it('trata como divergência quando ocorridoEm é após expiraEm', () => {
    expect(
      decidirNotificacao({
        ...base,
        estadoReserva: 'reservado',
        expiraEm: new Date('2030-01-01T00:15:00.000Z'),
        ocorridoEm: new Date('2030-01-01T00:16:00.000Z'),
        agora: new Date('2030-01-01T00:25:00.000Z'),
        tipo: 'confirmado',
        valorPagoCentavos: 10100,
      }),
    ).toEqual({
      novoStatus: 'confirmada',
      promoverReserva: false,
      divergencia: true,
      alocacoes: [],
    });
  });

  it('registra confirmação tardia sem reocupar o horário', () => {
    expect(
      decidirNotificacao({
        ...base,
        estadoReserva: 'cancelado',
        agora: new Date('2030-01-01T00:20:00.000Z'),
        tipo: 'confirmado',
        valorPagoCentavos: 10100,
      }),
    ).toEqual({
      novoStatus: 'confirmada',
      promoverReserva: false,
      divergencia: true,
      alocacoes: [],
    });
  });

  it('não confirma valor diferente do total autorizado', () => {
    expect(
      decidirNotificacao({
        ...base,
        tipo: 'confirmado',
        valorPagoCentavos: 10000,
      }),
    ).toEqual({ erro: 'valor_divergente' });
  });

  it('ignora falha posterior à confirmação', () => {
    expect(
      decidirNotificacao({
        ...base,
        statusCobranca: 'confirmada',
        tipo: 'falhou',
      }),
    ).toEqual({
      novoStatus: 'confirmada',
      promoverReserva: false,
      divergencia: false,
      alocacoes: [],
    });
  });

  it('libera nova tentativa ao falhar dentro do prazo', () => {
    expect(decidirNotificacao({ ...base, tipo: 'falhou' })).toEqual({
      novoStatus: 'falhou',
      promoverReserva: false,
      divergencia: false,
      alocacoes: [],
    });
  });
  it('rejeita valor divergente também em confirmação já registrada', () => {
    expect(
      decidirNotificacao({
        ...base,
        statusCobranca: 'confirmada',
        tipo: 'confirmado',
        valorPagoCentavos: 1,
      }),
    ).toEqual({ erro: 'valor_divergente' });
  });
});
