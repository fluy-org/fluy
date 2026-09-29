import {
  extrairDigitos,
  montarPadraoBuscaNome,
} from '@/shared/busca/busca.utils';

describe('busca.utils', () => {
  it('escapa curingas do LIKE no termo digitado', () => {
    expect(montarPadraoBuscaNome({ termo: '50%_ana' })).toBe('%50\\%\\_ana%');
  });

  it('extrai só os dígitos do termo', () => {
    expect(extrairDigitos({ termo: '(11) 98888-7777' })).toBe('11988887777');
  });
});
