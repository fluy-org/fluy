import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { PassThrough } from 'node:stream';
import { PagamentoWebhookController } from '../pagamento-webhook.controller';
import { PagamentoWebhookService } from '../pagamento-webhook.service';

describe('webhook HTTP controlado', () => {
  it('retorna 200 após persistência e 401 para credencial recusada', async () => {
    const service = { receber: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({
      controllers: [PagamentoWebhookController],
      providers: [{ provide: PagamentoWebhookService, useValue: service }],
    }).compile();
    const app = module.createNestApplication({ rawBody: true });
    await app.init();
    // Injeta HTTP no Express sem abrir porta ou depender da rede do host.
    const send = (url: string, body: unknown): Promise<number> =>
      new Promise((resolve, reject) => {
        const encoded = JSON.stringify(body);
        const req = new IncomingMessage(new Socket());
        req.method = 'POST';
        req.url = url;
        req.headers = {
          'content-type': 'application/json',
          'x-provider-signature': 'signature',
          'content-length': String(Buffer.byteLength(encoded)),
        };
        const res = new ServerResponse(req);
        const output = new PassThrough();
        output.resume();
        res.assignSocket(output as unknown as Socket);
        res.on('finish', () => {
          output.destroy();
          resolve(res.statusCode);
        });
        res.on('error', reject);
        (
          app.getHttpAdapter().getInstance() as {
            handle(req: IncomingMessage, res: ServerResponse): void;
          }
        ).handle(req, res);
        req.push(encoded);
        req.push(null);
      });
    try {
      expect(
        await send('/webhooks/pagamentos?hmac=test', { status: 'aceito' }),
      ).toBe(200);
      expect(service.receber).toHaveBeenCalledWith({
        body: { status: 'aceito' },
        query: { hmac: 'test' },
        headers: {
          'content-type': 'application/json',
          'content-length': String(
            Buffer.byteLength(JSON.stringify({ status: 'aceito' })),
          ),
          'x-provider-signature': 'signature',
        },
        rawBody: Buffer.from(JSON.stringify({ status: 'aceito' })),
      });
      service.receber.mockRejectedValueOnce(new UnauthorizedException());
      expect(await send('/webhooks/pagamentos?hmac=wrong', {})).toBe(401);
    } finally {
      await app.close();
    }
  });
});
