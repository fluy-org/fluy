import { formatarCpf, limparCpf, validarCpf } from './cpf';

describe('CPF Utils', () => {
  describe('formatarCpf', () => {
    it('deve formatar CPF progressivamente com pontuação', () => {
      expect(formatarCpf('123')).toBe('123');
      expect(formatarCpf('1234')).toBe('123.4');
      expect(formatarCpf('123456')).toBe('123.456');
      expect(formatarCpf('1234567')).toBe('123.456.7');
      expect(formatarCpf('123456789')).toBe('123.456.789');
      expect(formatarCpf('12345678901')).toBe('123.456.789-01');
    });

    it('deve aceitar valor colado já formatado sem duplicar pontuação', () => {
      expect(formatarCpf('123.456.789-01')).toBe('123.456.789-01');
    });

    it('deve ignorar caracteres não numéricos e limitar a 11 dígitos', () => {
      expect(formatarCpf('abc123def456ghi78901999')).toBe('123.456.789-01');
    });
  });

  describe('limparCpf', () => {
    it('deve extrair apenas dígitos', () => {
      expect(limparCpf('123.456.789-01')).toBe('12345678901');
      expect(limparCpf('123-abc-456')).toBe('123456');
    });
  });

  describe('validarCpf', () => {
    it('deve validar CPFs válidos', () => {
      // CPFs válidos matematicamente
      expect(validarCpf('52998224725')).toBeTrue();
      expect(validarCpf('529.982.247-25')).toBeTrue();
      expect(validarCpf('51687574219')).toBeTrue();
    });

    it('deve rejeitar CPFs com dígitos repetidos', () => {
      expect(validarCpf('111.111.111-11')).toBeFalse();
      expect(validarCpf('00000000000')).toBeFalse();
    });

    it('deve rejeitar CPFs com tamanho incompleto', () => {
      expect(validarCpf('123456789')).toBeFalse();
      expect(validarCpf('')).toBeFalse();
    });

    it('deve rejeitar CPFs com dígitos verificadores inválidos', () => {
      expect(validarCpf('52998224726')).toBeFalse();
      expect(validarCpf('12345678901')).toBeFalse();
    });
  });
});
