import { FakePaymentProvider } from '@/shared/providers/payment/fake-payment.provider';

describe('FakePaymentProvider', () => {
  const recebedor = {
    tipoChave: 'email' as const,
    chave: 'salao@example.com',
    nomeRecebedor: 'Salão Exemplo',
  };

  it('cota e cria uma cobrança idempotente sem chamada externa', async () => {
    const provider = new FakePaymentProvider();
    const cotacao = await provider.quotePix({
      valorSalaoCentavos: 10000,
      recebedor,
    });
    const input = {
      idempotencyKey: 'chave-1',
      cotacao,
      recebedor,
      expiraEm: new Date('2030-01-01T00:15:00.000Z'),
    };

    expect(cotacao.valorSalaoCentavos).toBe(10000);
    expect(cotacao.totalClienteCentavos).toBe(
      cotacao.valorSalaoCentavos + cotacao.taxaClienteCentavos,
    );
    expect(cotacao.taxaClienteCentavos).toBeGreaterThan(0);
    expect(await provider.createPixPayment(input)).toEqual(
      await provider.createPixPayment(input),
    );
  });

  it('recusa confirmação depois do prazo da reserva', async () => {
    const provider = new FakePaymentProvider();
    const pagamento = await provider.createPixPayment({
      idempotencyKey: 'chave-2',
      cotacao: await provider.quotePix({
        valorSalaoCentavos: 10000,
        recebedor,
      }),
      recebedor,
      expiraEm: new Date('2030-01-01T00:15:00.000Z'),
    });

    expect(
      provider.simulate({
        externalPaymentId: pagamento.externalId,
        resultado: 'confirmado',
        agora: new Date('2030-01-01T00:15:00.000Z'),
      }),
    ).toEqual({ erro: 'reserva_expirada' });
  });

  it('não confirma cobrança já recusada', async () => {
    const provider = new FakePaymentProvider();
    const pagamento = await provider.createPixPayment({
      idempotencyKey: 'chave-3',
      cotacao: await provider.quotePix({
        valorSalaoCentavos: 10000,
        recebedor,
      }),
      recebedor,
      expiraEm: new Date('2030-01-01T00:15:00.000Z'),
    });
    provider.simulate({
      externalPaymentId: pagamento.externalId,
      resultado: 'falhou',
      agora: new Date('2030-01-01T00:05:00.000Z'),
    });
    expect(
      provider.simulate({
        externalPaymentId: pagamento.externalId,
        resultado: 'confirmado',
        agora: new Date('2030-01-01T00:06:00.000Z'),
      }),
    ).toEqual({ erro: 'encerrado' });
  });
});
