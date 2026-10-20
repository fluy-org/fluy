import {
  alocarPagamento,
  chaveIdempotenciaEvento,
  validarCotacao,
} from '@/modules/pagamento/pagamento-utils';

describe('pagamento-utils', () => {
  it('deduplica evento por salão sem colidir entre salões', () => {
    const a = chaveIdempotenciaEvento({
      salaoId: 'salao-a',
      eventoId: 'mesmo-id',
    });
    expect(a).toBe(
      chaveIdempotenciaEvento({ salaoId: 'salao-a', eventoId: 'mesmo-id' }),
    );
    expect(a).not.toBe(
      chaveIdempotenciaEvento({ salaoId: 'salao-b', eventoId: 'mesmo-id' }),
    );
    expect(a.length).toBeLessThanOrEqual(200);
  });
  it('separa uma cobrança integral em sinal e restante sem incluir a taxa', () => {
    expect(
      alocarPagamento({
        modalidade: 'total',
        valorSalaoCentavos: 12000,
        valorSinalCentavos: 3000,
      }),
    ).toEqual([
      { tipo: 'sinal', valorCentavos: 3000 },
      { tipo: 'restante', valorCentavos: 9000 },
    ]);
  });

  it('aloca apenas o sinal quando essa é a modalidade', () => {
    expect(
      alocarPagamento({
        modalidade: 'sinal',
        valorSalaoCentavos: 3000,
        valorSinalCentavos: 3000,
      }),
    ).toEqual([{ tipo: 'sinal', valorCentavos: 3000 }]);
  });

  it('recusa sinal zero', () => {
    expect(
      alocarPagamento({
        modalidade: 'sinal',
        valorSalaoCentavos: 0,
        valorSinalCentavos: 0,
      }),
    ).toEqual([]);
  });

  it('recusa cotação cuja taxa não soma ao valor do salão', () => {
    expect(
      validarCotacao({
        valorSalaoCentavos: 12000,
        taxaClienteCentavos: 250,
        totalClienteCentavos: 12000,
      }),
    ).toBe(false);
  });

  it('aceita valores inteiros em centavos e soma exata', () => {
    expect(
      validarCotacao({
        valorSalaoCentavos: 12000,
        taxaClienteCentavos: 250,
        totalClienteCentavos: 12250,
      }),
    ).toBe(true);
  });
});
