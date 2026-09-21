import type { AvaliarHorarioAgendamentoInput } from '@/modules/agendamento/contracts';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';

describe('AgendamentoDisponibilidadeService', () => {
  const service = new AgendamentoDisponibilidadeService();

  it('gera horários únicos que cabem na janela', () => {
    const horarios = service.listarHorariosLivres(
      criarInput({
        profissionais: [
          criarProfissional({
            id: 'profissional-ana',
            janelas: [{ hora_inicio: '09:00', hora_fim: '10:00' }],
          }),
          criarProfissional({
            id: 'profissional-beatriz',
            janelas: [{ hora_inicio: '09:00', hora_fim: '10:00' }],
          }),
        ],
      }),
    );

    expect(horarios).toEqual(['09:00', '09:30']);
  });

  it('bloqueia horário fora da grade', () => {
    expect(service.avaliarHorario(criarInput({ horaInicio: '09:15' }))).toEqual(
      {
        status: 'indisponivel',
        avisos: [],
        bloqueios: ['fora_da_grade'],
        profissionalId: undefined,
      },
    );
  });

  it('permite encaixe fora da janela após confirmação', () => {
    expect(service.avaliarHorario(criarInput({ horaInicio: '18:00' }))).toEqual(
      {
        status: 'requer_confirmacao',
        avisos: ['fora_janela'],
        bloqueios: [],
        profissionalId: 'profissional-ana',
      },
    );
  });

  it('bloqueia data com override fechado', () => {
    expect(
      service.avaliarHorario(
        criarInput({
          profissionais: [
            criarProfissional({
              id: 'profissional-ana',
              janelas: [],
              fechado: true,
            }),
          ],
        }),
      ),
    ).toEqual({
      status: 'indisponivel',
      avisos: [],
      bloqueios: ['dia_fechado'],
      profissionalId: undefined,
    });
  });

  it('permite encaixe em dia sem janela quando não há override fechado', () => {
    expect(
      service.avaliarHorario(
        criarInput({
          profissionais: [
            criarProfissional({ id: 'profissional-ana', janelas: [] }),
          ],
        }),
      ),
    ).toEqual({
      status: 'requer_confirmacao',
      avisos: ['fora_janela'],
      bloqueios: [],
      profissionalId: 'profissional-ana',
    });
  });

  it('não confunde salão sem profissional ativa com dia fechado', () => {
    expect(service.avaliarHorario(criarInput({ profissionais: [] }))).toEqual({
      status: 'indisponivel',
      avisos: [],
      bloqueios: ['sem_profissional_disponivel'],
      profissionalId: undefined,
    });
  });

  it('bloqueia horário que conflita com ocupação da profissional', () => {
    expect(
      service.avaliarHorario(
        criarInput({
          horaInicio: '09:30',
          ocupacoes: [
            {
              profissional_id: 'profissional-ana',
              inicio_em: new Date('2026-04-10T12:15:00.000Z'),
              duracao_min: 30,
            },
          ],
        }),
      ),
    ).toEqual({
      status: 'indisponivel',
      avisos: [],
      bloqueios: ['sem_profissional_disponivel'],
      profissionalId: undefined,
    });
  });

  it('bloqueia agendamento que cruza a meia-noite no fuso do salão', () => {
    expect(
      service.avaliarHorario(
        criarInput({
          horaInicio: '23:45',
          duracaoMin: 30,
        }),
      ),
    ).toEqual({
      status: 'indisponivel',
      avisos: [],
      bloqueios: ['cruza_meia_noite'],
      profissionalId: undefined,
    });
  });

  it('exige confirmação para horário passado', () => {
    expect(
      service.avaliarHorario(
        criarInput({ agora: new Date('2026-04-10T15:00:00.000Z') }),
      ),
    ).toEqual({
      status: 'requer_confirmacao',
      avisos: ['inicio_passado'],
      bloqueios: [],
      profissionalId: 'profissional-ana',
    });
  });

  it('exige confirmação fora das antecedências mínima e máxima', () => {
    expect(
      service.avaliarHorario(
        criarInput({
          agora: new Date('2026-04-10T11:30:00.000Z'),
        }),
      ),
    ).toMatchObject({
      status: 'requer_confirmacao',
      avisos: ['antes_antecedencia_minima'],
    });

    expect(
      service.avaliarHorario(
        criarInput({
          data: '2026-04-18',
          agora: new Date('2026-04-10T12:00:00.000Z'),
        }),
      ),
    ).toMatchObject({
      status: 'requer_confirmacao',
      avisos: ['apos_antecedencia_maxima'],
    });
  });
});

function criarInput(
  sobrescritas: Partial<AvaliarHorarioAgendamentoInput> = {},
): AvaliarHorarioAgendamentoInput {
  return {
    data: '2026-04-10',
    horaInicio: '09:00',
    duracaoMin: 30,
    fusoHorario: 'America/Sao_Paulo',
    granularidadeMin: 30,
    antecedenciaMinHoras: 1,
    antecedenciaMaxDias: 7,
    agora: new Date('2026-04-09T12:00:00.000Z'),
    profissionais: [criarProfissional({ id: 'profissional-ana' })],
    ocupacoes: [],
    ...sobrescritas,
  };
}

function criarProfissional({
  id,
  janelas = [{ hora_inicio: '09:00', hora_fim: '18:00' }],
  fechado = false,
}: {
  id: string;
  janelas?: Array<{ hora_inicio: string; hora_fim: string }>;
  fechado?: boolean;
}) {
  return {
    id,
    janelas,
    fechado,
  };
}
