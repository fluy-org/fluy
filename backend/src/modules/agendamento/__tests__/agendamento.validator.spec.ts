import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AvaliacaoHorarioAgendamento } from '@/modules/agendamento/contracts';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

describe('AgendamentoValidator', () => {
  const validator = new AgendamentoValidator();

  it('retorna conflito quando não há profissional disponível', () => {
    expect(() =>
      validator.validarCriacao({
        avaliacao: criarAvaliacao({
          status: 'indisponivel',
          bloqueios: ['sem_profissional_disponivel'],
        }),
        confirmarExcecoes: false,
      }),
    ).toThrow(ConflictException);
  });

  it('recusa bloqueios que não podem ser confirmados', () => {
    expect(() =>
      validator.validarCriacao({
        avaliacao: criarAvaliacao({
          status: 'indisponivel',
          bloqueios: ['fora_da_grade'],
        }),
        confirmarExcecoes: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('exige confirmação para avisos', () => {
    expect(() =>
      validator.validarCriacao({
        avaliacao: criarAvaliacao({
          status: 'requer_confirmacao',
          avisos: ['fora_janela'],
        }),
        confirmarExcecoes: false,
      }),
    ).toThrow(BadRequestException);
  });

  it('aceita horário disponível e aviso confirmado', () => {
    expect(() =>
      validator.validarCriacao({
        avaliacao: criarAvaliacao({ status: 'disponivel' }),
        confirmarExcecoes: false,
      }),
    ).not.toThrow();

    expect(() =>
      validator.validarCriacao({
        avaliacao: criarAvaliacao({
          status: 'requer_confirmacao',
          avisos: ['inicio_passado'],
        }),
        confirmarExcecoes: true,
      }),
    ).not.toThrow();
  });

  describe('validarConclusao', () => {
    it('recusa conclusão de agendamento ainda reservado', () => {
      expect(() =>
        validator.validarConclusao({
          estado: 'reservado',
          valorPendente: '120.00',
          metodoPagamento: 'dinheiro',
        }),
      ).toThrow(BadRequestException);
    });

    it.each(['concluido', 'cancelado', 'falta'] as const)(
      'recusa conclusão de agendamento já encerrado em %s',
      (estado) => {
        expect(() =>
          validator.validarConclusao({
            estado,
            valorPendente: '120.00',
            metodoPagamento: 'dinheiro',
          }),
        ).toThrow(ConflictException);
      },
    );

    it('recusa método de pagamento quando não há valor pendente', () => {
      expect(() =>
        validator.validarConclusao({
          estado: 'agendado',
          valorPendente: '0.00',
          metodoPagamento: 'pix_pessoal',
        }),
      ).toThrow(BadRequestException);
    });

    it('aceita conclusão sem método quando há valor pendente', () => {
      expect(() =>
        validator.validarConclusao({
          estado: 'agendado',
          valorPendente: '120.00',
          metodoPagamento: null,
        }),
      ).not.toThrow();
    });

    it('aceita conclusão sem método quando o agendamento já está quitado', () => {
      expect(() =>
        validator.validarConclusao({
          estado: 'agendado',
          valorPendente: '0.00',
          metodoPagamento: null,
        }),
      ).not.toThrow();
    });

    it('aceita método de pagamento com valor pendente', () => {
      expect(() =>
        validator.validarConclusao({
          estado: 'agendado',
          valorPendente: '84.50',
          metodoPagamento: 'cartao_maquina',
        }),
      ).not.toThrow();
    });
  });

  describe('validarFalta', () => {
    const INICIO_EM = new Date('2026-09-15T13:00:00.000Z');

    it('recusa marcar falta em agendamento ainda reservado', () => {
      expect(() =>
        validator.validarFalta({
          estado: 'reservado',
          inicioEm: INICIO_EM,
          agora: new Date('2026-09-15T14:00:00.000Z'),
        }),
      ).toThrow(BadRequestException);
    });

    it.each(['concluido', 'cancelado', 'falta'] as const)(
      'recusa marcar falta de agendamento já encerrado em %s',
      (estado) => {
        expect(() =>
          validator.validarFalta({
            estado,
            inicioEm: INICIO_EM,
            agora: new Date('2026-09-15T14:00:00.000Z'),
          }),
        ).toThrow(ConflictException);
      },
    );

    it('recusa marcar falta antes de o atendimento começar', () => {
      expect(() =>
        validator.validarFalta({
          estado: 'agendado',
          inicioEm: INICIO_EM,
          agora: new Date('2026-09-15T12:59:59.000Z'),
        }),
      ).toThrow(BadRequestException);
    });

    it('aceita marcar falta no instante exato do início', () => {
      expect(() =>
        validator.validarFalta({
          estado: 'agendado',
          inicioEm: INICIO_EM,
          agora: INICIO_EM,
        }),
      ).not.toThrow();
    });

    it('aceita marcar falta dentro da tolerância: o aviso não bloqueia', () => {
      expect(() =>
        validator.validarFalta({
          estado: 'agendado',
          inicioEm: INICIO_EM,
          agora: new Date('2026-09-15T13:05:00.000Z'),
        }),
      ).not.toThrow();
    });

    it('aceita marcar falta bem depois do horário', () => {
      expect(() =>
        validator.validarFalta({
          estado: 'agendado',
          inicioEm: INICIO_EM,
          agora: new Date('2026-09-16T10:00:00.000Z'),
        }),
      ).not.toThrow();
    });
  });

  describe('validarCancelamento', () => {
    it.each(['agendado', 'reservado'] as const)(
      'aceita cancelar agendamento em %s',
      (estado) => {
        expect(() => validator.validarCancelamento({ estado })).not.toThrow();
      },
    );

    it.each(['concluido', 'cancelado', 'falta'] as const)(
      'recusa cancelar agendamento já encerrado em %s',
      (estado) => {
        expect(() => validator.validarCancelamento({ estado })).toThrow(
          ConflictException,
        );
      },
    );
  });

  describe('validarRemarcacao', () => {
    const INICIO_ATUAL = new Date('2026-09-15T13:00:00.000Z');
    const INICIO_NOVO = new Date('2026-09-16T13:00:00.000Z');
    const entrada = {
      estado: 'agendado' as const,
      inicioEmAtual: INICIO_ATUAL,
      inicioEmNovo: INICIO_NOVO,
      avaliacao: criarAvaliacao({}),
      confirmarExcecoes: false,
    };

    it('aceita mover para horário livre dentro da janela', () => {
      expect(() => validator.validarRemarcacao(entrada)).not.toThrow();
    });

    it('recusa remarcar agendamento ainda reservado', () => {
      expect(() =>
        validator.validarRemarcacao({ ...entrada, estado: 'reservado' }),
      ).toThrow(BadRequestException);
    });

    it.each(['concluido', 'cancelado', 'falta'] as const)(
      'recusa remarcar agendamento já encerrado em %s',
      (estado) => {
        expect(() =>
          validator.validarRemarcacao({ ...entrada, estado }),
        ).toThrow(ConflictException);
      },
    );

    it('recusa remarcar para o horário que o agendamento já tem', () => {
      expect(() =>
        validator.validarRemarcacao({
          ...entrada,
          inicioEmNovo: new Date(INICIO_ATUAL),
        }),
      ).toThrow(BadRequestException);
    });

    it('recusa remarcar para o passado mesmo com exceções confirmadas', () => {
      expect(() =>
        validator.validarRemarcacao({
          ...entrada,
          avaliacao: criarAvaliacao({
            status: 'requer_confirmacao',
            avisos: ['inicio_passado'],
          }),
          confirmarExcecoes: true,
        }),
      ).toThrow(BadRequestException);
    });

    it('recusa horário sem profissional livre com conflito', () => {
      expect(() =>
        validator.validarRemarcacao({
          ...entrada,
          avaliacao: criarAvaliacao({
            status: 'indisponivel',
            bloqueios: ['sem_profissional_disponivel'],
          }),
        }),
      ).toThrow(ConflictException);
    });

    it.each(['dia_fechado', 'fora_da_grade', 'cruza_meia_noite'] as const)(
      'recusa horário bloqueado por %s',
      (bloqueio) => {
        expect(() =>
          validator.validarRemarcacao({
            ...entrada,
            avaliacao: criarAvaliacao({
              status: 'indisponivel',
              bloqueios: [bloqueio],
            }),
            confirmarExcecoes: true,
          }),
        ).toThrow(BadRequestException);
      },
    );

    it('exige confirmação para encaixe fora da janela', () => {
      const avaliacao = criarAvaliacao({
        status: 'requer_confirmacao',
        avisos: ['fora_janela'],
      });

      expect(() =>
        validator.validarRemarcacao({ ...entrada, avaliacao }),
      ).toThrow(BadRequestException);
      expect(() =>
        validator.validarRemarcacao({
          ...entrada,
          avaliacao,
          confirmarExcecoes: true,
        }),
      ).not.toThrow();
    });
  });
});

function criarAvaliacao(
  sobrescritas: Partial<AvaliacaoHorarioAgendamento>,
): AvaliacaoHorarioAgendamento {
  return {
    status: 'disponivel',
    avisos: [],
    bloqueios: [],
    profissionalId: 'profissional-ana',
    ...sobrescritas,
  };
}
