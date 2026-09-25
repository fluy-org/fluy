jest.mock('@fluy/schema', () => ({}));

import {
  codificarCursorPagina,
  decodificarCursorPagina,
  extrairDigitos,
  montarPadraoBuscaNome,
  montarPagina,
} from '@/modules/cliente/cliente-utils';

describe('cliente-utils', () => {
  describe('cursor de página', () => {
    it('decodifica o offset que foi codificado', () => {
      const cursor = codificarCursorPagina({ offset: 40 });

      expect(decodificarCursorPagina({ cursor })).toBe(40);
    });

    it('rejeita cursor que não carrega um offset', () => {
      expect(
        decodificarCursorPagina({ cursor: 'nao-e-um-cursor' }),
      ).toBeUndefined();
      expect(
        decodificarCursorPagina({
          cursor: Buffer.from('-1').toString('base64url'),
        }),
      ).toBeUndefined();
    });
  });

  describe('montarPagina', () => {
    it('corta o item excedente e aponta para a próxima página', () => {
      expect(
        montarPagina({ linhas: [1, 2, 3], offset: 4, tamanho: 2 }),
      ).toEqual({
        itens: [1, 2],
        proximoCursor: codificarCursorPagina({ offset: 6 }),
      });
    });

    it('encerra a paginação quando não há item excedente', () => {
      expect(montarPagina({ linhas: [1, 2], offset: 0, tamanho: 2 })).toEqual({
        itens: [1, 2],
        proximoCursor: null,
      });
    });
  });

  describe('busca', () => {
    it('escapa curingas do LIKE no termo digitado', () => {
      expect(montarPadraoBuscaNome({ termo: '50%_ana' })).toBe('%50\\%\\_ana%');
    });

    it('extrai só os dígitos do termo', () => {
      expect(extrairDigitos({ termo: '(11) 98888-7777' })).toBe('11988887777');
    });
  });
});
