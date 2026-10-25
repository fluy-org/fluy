import { ConfigService } from '@nestjs/config';
import { EfiClient, type RequestInput } from '../efi/efi-client';

describe('EfiClient', () => {
  const config = new ConfigService({
    EFI_CLIENT_ID: 'id',
    EFI_CLIENT_SECRET: 'secret',
    EFI_CERTIFICATE_PATH: 'test.p12',
    EFI_CERTIFICATE_PASSPHRASE: '',
  });
  const transport = { send: jest.fn<Promise<unknown>, [RequestInput]>() };
  let client: EfiClient;
  beforeEach(() => {
    jest.clearAllMocks();
    client = new EfiClient(config as never, transport as never);
  });
  it('compartilha autenticação concorrente e reutiliza token válido', async () => {
    transport.send
      .mockResolvedValueOnce({
        access_token: 'token',
        expires_in: 3600,
        token_type: 'Bearer',
      })
      .mockResolvedValue({ ok: true });
    await Promise.all([
      client.request({ method: 'GET', path: '/v1/participantes' }),
      client.request({ method: 'GET', path: '/v1/participantes' }),
    ]);
    expect(
      transport.send.mock.calls.filter(([i]) => i.path === '/v1/oauth/token'),
    ).toHaveLength(1);
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/v1/oauth/token',
        headers: expect.objectContaining({
          Authorization: 'Basic aWQ6c2VjcmV0',
        }) as unknown,
        body: { grant_type: 'client_credentials' },
      }),
    );
    expect(transport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }) as unknown,
      }),
    );
  });
  it('recusa token malformado e não expõe segredo no erro', async () => {
    transport.send.mockResolvedValue({ access_token: 'secret' });
    await expect(
      client.request({ method: 'GET', path: '/v1/participantes' }),
    ).rejects.toThrow('Resposta de autenticação inválida.');
  });
  it('renova uma vez depois de 401 preservando a chave de idempotência', async () => {
    transport.send
      .mockResolvedValueOnce({ access_token: 'a', expires_in: 3600 })
      .mockRejectedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ access_token: 'b', expires_in: 3600 })
      .mockResolvedValueOnce({ ok: true });
    await client.request({
      method: 'POST',
      path: '/v1/pagamentos/pix',
      headers: { 'x-idempotency-key': 'same' },
      body: { valor: '1.00' },
    });
    expect(transport.send.mock.calls[3][0]).toMatchObject({
      headers: { Authorization: 'Bearer b', 'x-idempotency-key': 'same' },
      body: { valor: '1.00' },
    });
  });
  it('normaliza timeout e falhas sem incluir resposta externa', async () => {
    transport.send.mockRejectedValue(new Error('client-secret'));
    await expect(
      client.request({ method: 'GET', path: '/v1/participantes' }),
    ).rejects.toThrow('Comunicação com o provedor de pagamento indisponível.');
  });
  it('renova token antes do vencimento e limita repetição de 401', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      transport.send
        .mockReset()
        .mockResolvedValueOnce({ access_token: 'a', expires_in: 31 })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ access_token: 'b', expires_in: 3600 })
        .mockResolvedValueOnce({ ok: true });
      await client.request({ method: 'GET', path: '/v1/participantes' });
      clock.mockReturnValue(3000);
      await client.request({ method: 'GET', path: '/v1/participantes' });
      expect(
        transport.send.mock.calls.filter(([i]) => i.path === '/v1/oauth/token'),
      ).toHaveLength(2);
      transport.send.mockReset().mockRejectedValue({ status: 401 });
      await expect(
        client.request({ method: 'GET', path: '/v1/participantes' }),
      ).rejects.toThrow(
        'Comunicação com o provedor de pagamento indisponível.',
      );
      expect(transport.send.mock.calls.length).toBeLessThanOrEqual(3);
    } finally {
      clock.mockRestore();
    }
  });
  it('preserva ausência de registros para a consulta sem expor resposta externa', async () => {
    transport.send
      .mockReset()
      .mockResolvedValueOnce({ access_token: 'a', expires_in: 3600 })
      .mockRejectedValueOnce({ status: 404 });
    await expect(
      client.request({ method: 'GET', path: '/v1/pagamentos/pix' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
