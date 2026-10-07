import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';
import { gerarCalendarioIcs } from '@/modules/aviso/calendario-ics.utils';
import type { SalaoConsultado } from '@/modules/salao/contracts';

describe('gerarCalendarioIcs', () => {
  const salao = {
    id: 'salao-1',
    nome: 'Salão da Ana',
    endereco: 'Rua das Flores, 10',
  } as SalaoConsultado;
  const agendamento = {
    id: '8d25dbac-1cb2-46b0-b25d-483d8502918c',
    salao_id: salao.id,
    inicio_em: new Date('2026-10-10T13:00:00.000Z'),
    duracao_min: 60,
    estado: 'agendado',
    remarcado_vezes: 0,
    cliente: { id: 'cliente-1', nome: 'Júlia' },
    procedimento: { id: 'procedimento-1', nome: 'Corte, hidratação' },
  } as AgendamentoDetalheResultado;

  it('gera convite inicial em UTC com UID estável', () => {
    const resultado = gerarCalendarioIcs({
      agendamento,
      salao,
      agora: new Date('2026-10-06T12:00:00.000Z'),
    });

    expect(resultado.metodo).toBe('REQUEST');
    expect(resultado.conteudo).toContain('METHOD:REQUEST\r\n');
    expect(resultado.conteudo).toContain(
      `UID:agendamento-${agendamento.id}@fluy`,
    );
    expect(resultado.conteudo).toContain('DTSTART:20261010T130000Z');
    expect(resultado.conteudo).toContain('DTEND:20261010T140000Z');
    expect(resultado.conteudo).toContain('SEQUENCE:0');
    expect(resultado.conteudo).toContain('Corte\\, hidratação');
  });

  it('mantém o UID e incrementa a sequência apó remarcações', () => {
    const resultado = gerarCalendarioIcs({
      agendamento: {
        ...agendamento,
        inicio_em: new Date('2026-10-11T15:00:00.000Z'),
        remarcado_vezes: 2,
      },
      salao,
    });

    expect(resultado.conteudo).toContain(
      `UID:agendamento-${agendamento.id}@fluy`,
    );
    expect(resultado.conteudo).toContain('SEQUENCE:2');
    expect(resultado.conteudo).toContain('DTSTART:20261011T150000Z');
  });

  it('gera cancelamento para o mesmo evento', () => {
    const resultado = gerarCalendarioIcs({
      agendamento: { ...agendamento, estado: 'cancelado' },
      salao,
    });

    expect(resultado.metodo).toBe('CANCEL');
    expect(resultado.conteudo).toContain('METHOD:CANCEL\r\n');
    expect(resultado.conteudo).toContain('STATUS:CANCELLED\r\n');
    expect(resultado.conteudo).toContain(
      `UID:agendamento-${agendamento.id}@fluy`,
    );
  });

  it('dobra todas as linhas em no máximo 75 bytes', () => {
    const resultado = gerarCalendarioIcs({ agendamento, salao });

    for (const linha of resultado.conteudo.split('\r\n').filter(Boolean)) {
      expect(Buffer.byteLength(linha, 'utf8')).toBeLessThanOrEqual(75);
    }
  });
});
