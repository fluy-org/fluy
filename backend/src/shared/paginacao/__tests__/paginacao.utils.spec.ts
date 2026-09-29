import {
  codificarCursorPagina,
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

describe('paginacao.utils', () => {
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
});
