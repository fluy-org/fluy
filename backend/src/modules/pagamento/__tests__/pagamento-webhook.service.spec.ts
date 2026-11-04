import { PagamentoWebhookService } from '@/modules/pagamento/pagamento-webhook.service';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider } from '@/modules/pagamento/contracts';

describe('PagamentoWebhookService', () => {
  const provider = {
    name: 'fake',
    parseNotification: jest.fn(),
  };
  const repo = {
    registrarNotificacao: jest.fn(),
    reagendarNotificacao: jest.fn(),
    buscarCobrancaDoEvento: jest.fn(),
    listarNotificacoesPendentes: jest.fn(),
  };
  const pagamentos = { processarNotificacao: jest.fn() };
  const service = new PagamentoWebhookService(
    repo as never,
    pagamentos as never,
    provider as never,
  );
  const event = {
    provider: 'fake',
    eventId: 'e1',
    externalPaymentId: 'external',
    reference: 'key',
    tipo: 'confirmado',
    valorPagoCentavos: 2500,
    ocorridoEm: new Date(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    provider.parseNotification.mockReturnValue(event);
    repo.registrarNotificacao.mockResolvedValue({
      id: 'row',
      status: 'recebido',
    });
    repo.buscarCobrancaDoEvento.mockResolvedValue({ salao_id: 's1' });
  });
  it('não persiste notificação sem autenticação', async () => {
    provider.parseNotification.mockImplementationOnce(() => {
      throw new Error('unauthorized');
    });
    await expect(
      service.receber({ body: {}, query: { hmac: 'bad' }, headers: {} }),
    ).rejects.toThrow();
    expect(repo.registrarNotificacao).not.toHaveBeenCalled();
  });
  it('persiste antes de processar e obtém salão por correlação interna', async () => {
    await service.receber({ body: {}, query: { hmac: 'secret' }, headers: {} });
    expect(pagamentos.processarNotificacao).toHaveBeenCalledWith({
      salaoId: 's1',
      notificacao: { ...event, registroId: 'row' },
    });
    expect(repo.registrarNotificacao.mock.invocationCallOrder[0]).toBeLessThan(
      pagamentos.processarNotificacao.mock.invocationCallOrder[0],
    );
  });
  it('mantém recebido evento sem cobrança e reprocessa depois', async () => {
    repo.buscarCobrancaDoEvento.mockResolvedValueOnce(undefined);
    await service.receber({ body: {}, query: { hmac: 'secret' }, headers: {} });
    expect(pagamentos.processarNotificacao).not.toHaveBeenCalled();
    repo.listarNotificacoesPendentes.mockResolvedValue([
      {
        id: 'row',
        payload: { ...event, ocorridoEm: event.ocorridoEm.toISOString() },
      },
    ]);
    await service.reprocessar();
    expect(pagamentos.processarNotificacao).toHaveBeenCalledWith({
      salaoId: 's1',
      notificacao: { ...event, registroId: 'row' },
    });
  });
  it('não reaplica evento já processado', async () => {
    repo.registrarNotificacao.mockResolvedValue({
      id: 'row',
      status: 'processado',
    });
    await service.receber({ body: {}, query: { hmac: 'secret' }, headers: {} });
    expect(pagamentos.processarNotificacao).not.toHaveBeenCalled();
  });
  it('mantém falha recuperável e continua o lote de reprocessamento', async () => {
    pagamentos.processarNotificacao.mockRejectedValueOnce(
      new Error('temporary'),
    );
    await service.receber({ body: {}, query: { hmac: 'secret' }, headers: {} });
    expect(repo.reagendarNotificacao).toHaveBeenCalledWith({
      id: 'row',
      falhou: true,
    });
    repo.listarNotificacoesPendentes.mockResolvedValue([
      {
        id: 'row',
        payload: { ...event, ocorridoEm: event.ocorridoEm.toISOString() },
      },
    ]);
    await service.reprocessar();
    expect(pagamentos.processarNotificacao).toHaveBeenCalledTimes(2);
  });
  it('delega envelope HTTP intacto sem interpretar autenticação do provider', async () => {
    const input = {
      body: { external: true },
      rawBody: Buffer.from('{ "external": true }'),
      headers: { 'other-provider-signature': 'signed' },
      query: { event: 'external-event' },
    };
    await service.receber(input);
    expect(provider.parseNotification).toHaveBeenCalledWith(input);
  });
  it('aguarda autenticação assíncrona sobre raw body antes de persistir', async () => {
    const rawBody = Buffer.from('{ "payment": "external", "value": 2500 }');
    const signature = createHmac('sha256', 'test-secret')
      .update(rawBody)
      .digest('hex');
    let release!: () => void;
    const verified = new Promise<void>((resolve) => {
      release = resolve;
    });
    const adapter: PaymentProvider = {
      name: 'other',
      quotePix: jest.fn(),
      createPixPayment: jest.fn(),
      async parseNotification(input) {
        await verified;
        const expected = createHmac('sha256', 'test-secret')
          .update(input.rawBody!)
          .digest('hex');
        const received = input.headers['other-signature'];
        if (
          typeof received !== 'string' ||
          received.length !== expected.length ||
          !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
        )
          throw new Error('invalid signature');
        return { ...event, provider: 'other', tipo: 'confirmado' };
      },
    };
    const subject = new PagamentoWebhookService(
      repo as never,
      pagamentos as never,
      adapter,
    );
    const receiving = subject.receber({
      body: {},
      rawBody,
      headers: { 'other-signature': signature },
      query: {},
    });
    expect(repo.registrarNotificacao).not.toHaveBeenCalled();
    release();
    await receiving;
    expect(repo.registrarNotificacao).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'other' }),
    );
    repo.registrarNotificacao.mockClear();
    await expect(
      subject.receber({
        body: {},
        rawBody: Buffer.from('{}'),
        headers: { 'other-signature': signature },
        query: {},
      }),
    ).rejects.toThrow('invalid signature');
    expect(repo.registrarNotificacao).not.toHaveBeenCalled();
  });

  it.each([undefined, 'other'])(
    'recusa origem ausente ou divergente: %s',
    async (origin) => {
      provider.parseNotification.mockReturnValueOnce({
        ...event,
        provider: origin,
      });
      await expect(
        service.receber({ body: {}, headers: {}, query: {} }),
      ).rejects.toThrow('Origem');
      expect(repo.registrarNotificacao).not.toHaveBeenCalled();
    },
  );

  it.each(['other', 'disabled'])(
    'reprocessa origem persistida com provider ativo %s',
    async (name) => {
      repo.listarNotificacoesPendentes.mockResolvedValueOnce([
        {
          id: 'old-row',
          payload: {
            ...event,
            provider: 'efi',
            ocorridoEm: event.ocorridoEm.toISOString(),
          },
        },
      ]);
      const subject = new PagamentoWebhookService(
        repo as never,
        pagamentos as never,
        {
          name,
          quotePix: jest.fn(),
          createPixPayment: jest.fn(),
        },
      );
      await subject.reprocessar();
      expect(repo.listarNotificacoesPendentes).toHaveBeenCalledWith();
      expect(pagamentos.processarNotificacao).toHaveBeenCalledWith({
        salaoId: 's1',
        notificacao: { ...event, provider: 'efi', registroId: 'old-row' },
      });
    },
  );
});
