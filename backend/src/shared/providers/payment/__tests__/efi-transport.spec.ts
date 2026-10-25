import { EventEmitter } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { request, Agent } from 'node:https';
import type { IncomingMessage } from 'node:http';
import { EfiTransport } from '../efi/efi-client';
jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  readFileSync: jest.fn(() => Buffer.from('certificate')),
}));
jest.mock('node:https', () => ({
  ...jest.requireActual<typeof import('node:https')>('node:https'),
  request: jest.fn(),
  Agent: jest.fn(),
}));

describe('transporte HTTP Efí', () => {
  let req: EventEmitter & { end: jest.Mock; destroy: jest.Mock };
  let res: EventEmitter & { statusCode: number; destroy: jest.Mock };
  let transport: EfiTransport;
  beforeEach(() => {
    jest.clearAllMocks();
    req = Object.assign(new EventEmitter(), {
      end: jest.fn(),
      destroy: jest.fn((error: Error) => {
        req.emit('error', error);
        req.emit('close');
      }),
    });
    res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      destroy: jest.fn(),
    });
    (request as jest.Mock).mockImplementation(
      (_options: unknown, callback: (r: IncomingMessage) => void) => {
        callback(res as unknown as IncomingMessage);
        return req;
      },
    );
    transport = new EfiTransport(
      new ConfigService({
        EFI_CERTIFICATE_PATH: '/cert.p12',
        EFI_CERTIFICATE_PASSPHRASE: 'pass',
      }) as never,
    );
  });
  afterEach(() => {
    req.emit('close');
    jest.useRealTimers();
  });
  it('usa mTLS, host fixo e JSON sem seguir redirects', async () => {
    const result = transport.send({
      method: 'POST',
      path: '/v1/oauth/token',
      body: { grant_type: 'client_credentials' },
    });
    res.emit('data', Buffer.from('{"ok":true}'));
    res.emit('end');
    expect(await result).toEqual({ ok: true });
    expect(Agent).toHaveBeenCalledWith(
      expect.objectContaining({
        pfx: Buffer.from('certificate'),
        passphrase: 'pass',
        minVersion: 'TLSv1.2',
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'openfinance-h.api.efipay.com.br',
        method: 'POST',
      }),
      expect.any(Function),
    );
    expect(req.end).toHaveBeenCalledWith('{"grant_type":"client_credentials"}');
  });
  it.each([302, 401, 422, 500])('rejeita HTTP %s', async (status) => {
    res.statusCode = status;
    const result = transport.send({ method: 'GET', path: '/v1/participantes' });
    res.emit('end');
    await expect(result).rejects.toMatchObject({ status });
  });
  it('recusa JSON inválido e encerra timeout absoluto', async () => {
    const invalid = transport.send({
      method: 'GET',
      path: '/v1/participantes',
    });
    res.emit('data', Buffer.from('invalid'));
    res.emit('end');
    await expect(invalid).rejects.toThrow('invalid_json');
    req.emit('close');
    jest.useFakeTimers();
    const timeout = transport.send({
      method: 'GET',
      path: '/v1/participantes',
    });
    jest.advanceTimersByTime(10000);
    await expect(timeout).rejects.toThrow('timeout');
  });
});
