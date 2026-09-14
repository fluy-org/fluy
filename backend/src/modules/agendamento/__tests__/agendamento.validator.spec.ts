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
