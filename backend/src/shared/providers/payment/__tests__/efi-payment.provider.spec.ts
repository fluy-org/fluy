import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EfiWebhookAdapter } from '../efi/efi-webhook.adapter';
import { EfiPaymentProvider } from '../efi/efi-payment.provider';

describe('EfiPaymentProvider', () => {
  const client = { request: jest.fn() };
  const config = new ConfigService({ EFI_WEBHOOK_SECRET: 'a'.repeat(64) });
  let provider: EfiPaymentProvider;
  const input = {
    idempotencyKey: 'attempt',
    cotacao: {
      valorSalaoCentavos: 2500,
      taxaClienteCentavos: 0,
      totalClienteCentavos: 2500,
    },
    recebedor: {
      tipoChave: 'email' as const,
      chave: 'salon@example.com',
      nomeRecebedor: 'Salão',
    },
    pagador: {
      cpf: '51687574219',
      instituicao_id: '9f4cd202-8f2b-11ec-b909-0242ac120002',
    },
    expiraEm: new Date(Date.now() + 60000),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    provider = new EfiPaymentProvider(
      client as never,
      new EfiWebhookAdapter(config as never),
    );
  });
  it('usa contrato oficial, referência persistida e URL sem confirmar pagamento', async () => {
    client.request.mockResolvedValue({
      identificadorPagamento: 'urn:efi:1',
      redirectURI: 'https://bank.example/authorize',
    });
    expect(await provider.createPixPayment(input)).toEqual({
      externalId: 'urn:efi:1',
      status: 'pendente',
      instrucaoCliente: {
        tipo: 'url',
        valor: 'https://bank.example/authorize',
      },
    });
    expect(client.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/pagamentos/pix',
      headers: { 'x-idempotency-key': 'attempt' },
      body: {
        pagador: {
          cpf: input.pagador.cpf,
          idParticipante: input.pagador.instituicao_id,
        },
        favorecido: { chave: 'salon@example.com' },
        pagamento: { valor: '25.00', idProprio: 'attempt' },
      },
    });
  });
  it('não inventa tarifa em homologação', async () => {
    expect(
      await provider.quotePix({
        valorSalaoCentavos: 2500,
        recebedor: input.recebedor,
      }),
    ).toEqual(input.cotacao);
  });
  it('recusa pagador ausente e resposta inválida', async () => {
    await expect(
      provider.createPixPayment({ ...input, pagador: undefined }),
    ).rejects.toThrow();
    client.request.mockResolvedValue({
      identificadorPagamento: 'id',
      redirectURI: 'javascript:alert(1)',
    });
    await expect(provider.createPixPayment(input)).rejects.toThrow();
  });
  it('autentica callback e produz ID determinístico para reentrega', () => {
    const body = {
      identificadorPagamento: 'urn:efi:1',
      idProprio: 'attempt',
      valor: '25.00',
      status: 'aceito',
      dataCriacao: '2026-10-25T12:00:00.000Z',
      tipo: 'pagamento',
    };
    expect(() =>
      provider.parseNotification({
        body,
        headers: {},
        query: { hmac: 'wrong' },
      }),
    ).toThrow();
    const event = provider.parseNotification({
      body,
      headers: {},
      query: { hmac: 'a'.repeat(64) },
    });
    expect(event).toMatchObject({
      externalPaymentId: 'urn:efi:1',
      reference: 'attempt',
      tipo: 'confirmado',
      tipoBruto: 'aceito',
      valorPagoCentavos: 2500,
    });
    expect(
      provider.parseNotification({
        body,
        headers: {},
        query: { hmac: 'a'.repeat(64) },
      }),
    ).toEqual(event);
    expect(() =>
      provider.parseNotification({
        body: { ...body, valor: '2e3' },
        headers: {},
        query: { hmac: 'a'.repeat(64) },
      }),
    ).toThrow();
  });
  it('consulta listagem oficial e seleciona somente o identificador solicitado', async () => {
    client.request.mockResolvedValue({
      pagamentos: [
        {
          identificadorPagamento: 'urn:efi:1',
          valor: '25.00',
          status: 'aceito',
          dataCriacao: '2026-10-25T12:00:00.000Z',
        },
      ],
      proximo: null,
    });
    expect(
      await provider.getPixPayment({
        externalId: 'urn:efi:1',
        createdAt: new Date('2026-10-25T12:00:00Z'),
      }),
    ).toMatchObject({ tipo: 'confirmado', valorPagoCentavos: 2500 });
    expect(client.request).toHaveBeenCalledWith({
      method: 'GET',
      path: `/v1/pagamentos/pix?inicio=2026-10-25&fim=${new Date().toISOString().slice(0, 10)}`,
    });
  });
  it('não converte pendência nem status desconhecido em confirmação', () => {
    const body = {
      identificadorPagamento: 'id',
      valor: '25.00',
      status: 'pendente',
      dataCriacao: '2026-10-25T12:00:00.000Z',
      tipo: 'pagamento',
    };
    expect(
      provider.parseNotification({
        body,
        headers: {},
        query: { hmac: 'a'.repeat(64) },
      }),
    ).toBeNull();
    expect(() =>
      provider.parseNotification({
        body: { ...body, status: 'settled' },
        headers: {},
        query: { hmac: 'a'.repeat(64) },
      }),
    ).toThrow();
    expect(() =>
      provider.parseNotification({
        body,
        headers: {},
        query: { hmac: 'é'.repeat(64) },
      }),
    ).toThrow('Notificação não autenticada.');
  });
  it('recusa links de paginação que desviem da API de pagamentos', async () => {
    client.request.mockResolvedValue({
      pagamentos: [],
      proximo: 'https://evil.example',
    });
    await expect(
      provider.getPixPayment({ externalId: 'id', createdAt: new Date() }),
    ).rejects.toThrow('Paginação do provedor inválida.');
  });
  it('lista instituições por contrato neutro e recusa resposta inválida', async () => {
    client.request.mockResolvedValueOnce({
      participantes: [
        { identificador: input.pagador.instituicao_id, nome: 'Banco' },
      ],
    });
    expect(await provider.listPixParticipants()).toEqual([
      { id: input.pagador.instituicao_id, nome: 'Banco' },
    ]);
    client.request.mockResolvedValueOnce({ participantes: 'invalid' });
    await expect(provider.listPixParticipants()).rejects.toThrow(
      'Resposta de instituições inválida.',
    );
  });
  it('mantém pendência quando a listagem ainda não possui pagamentos', async () => {
    client.request.mockRejectedValueOnce(new NotFoundException());
    await expect(
      provider.getPixPayment({ externalId: 'id', createdAt: new Date() }),
    ).resolves.toBeNull();
  });
});
