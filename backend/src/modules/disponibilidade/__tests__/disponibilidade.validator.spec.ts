import { BadRequestException } from '@nestjs/common';
import { DisponibilidadeValidator } from '@/modules/disponibilidade/disponibilidade.validator';

describe('DisponibilidadeValidator', () => {
  const validator = new DisponibilidadeValidator();

  it('rejeita janelas semanais sobrepostas no mesmo dia', () => {
    expect(() =>
      validator.validarAtualizacaoSemanal({
        janelas: [
          { dia_semana: 1, hora_inicio: '09:00', hora_fim: '12:00' },
          { dia_semana: 1, hora_inicio: '11:00', hora_fim: '14:00' },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('aceita janelas semanais adjacentes', () => {
    const dados = {
      janelas: [
        { dia_semana: 1, hora_inicio: '09:00', hora_fim: '12:00' },
        { dia_semana: 1, hora_inicio: '12:00', hora_fim: '14:00' },
      ],
    };

    expect(validator.validarAtualizacaoSemanal(dados)).toBe(dados);
  });

  it('rejeita override aberto sem janelas', () => {
    expect(() =>
      validator.validarAtualizacaoOverride({ fechado: false }),
    ).toThrow(BadRequestException);
  });

  it('rejeita override fechado com janelas', () => {
    expect(() =>
      validator.validarAtualizacaoOverride({
        fechado: true,
        janelas: [{ hora_inicio: '09:00', hora_fim: '12:00' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita janelas sobrepostas em override aberto', () => {
    expect(() =>
      validator.validarAtualizacaoOverride({
        fechado: false,
        janelas: [
          { hora_inicio: '09:00', hora_fim: '12:00' },
          { hora_inicio: '11:00', hora_fim: '14:00' },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita data de override inválida', () => {
    expect(() => validator.validarData('2026-02-30')).toThrow(
      BadRequestException,
    );
  });
});
