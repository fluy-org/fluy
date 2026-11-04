import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent, request } from 'node:https';
import { readFileSync } from 'node:fs';
import type { Env } from '@/config/env.schema';
import type { RequestInput } from '@/shared/providers/payment/efi/contracts';

export class EfiHttpError extends Error {
  constructor(
    readonly status?: number,
    readonly body?: string,
  ) {
    super('Falha HTTP no provedor.');
  }
}

@Injectable()
export class EfiTransport {
  private agent?: Agent;
  constructor(private readonly config: ConfigService<Env, true>) {}
  send(input: RequestInput): Promise<unknown> {
    this.agent ??= new Agent({
      pfx: readFileSync(
        this.config.get('EFI_CERTIFICATE_PATH', { infer: true }),
      ),
      passphrase: this.config.get('EFI_CERTIFICATE_PASSPHRASE', {
        infer: true,
      }),
      minVersion: 'TLSv1.2',
      keepAlive: true,
    });
    return new Promise((resolve, reject) => {
      const body =
        input.body === undefined ? undefined : JSON.stringify(input.body);
      const req = request(
        {
          hostname: 'openfinance-h.api.efipay.com.br',
          path: input.path,
          method: input.method,
          agent: this.agent,
          headers: {
            'Content-Type': 'application/json',
            ...input.headers,
            ...(body
              ? { 'Content-Length': Buffer.byteLength(body).toString() }
              : {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          res.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > 2_000_000) {
              res.destroy();
              req.destroy(new Error('response_limit'));
            } else chunks.push(chunk);
          });
          res.on('error', reject);
          res.on('end', () => {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            if (
              !res.statusCode ||
              res.statusCode < 200 ||
              res.statusCode >= 300
            ) {
              console.error(
                '[EFI HTTP ERROR]',
                res.statusCode,
                rawBody,
              );
              return reject(new EfiHttpError(res.statusCode, rawBody));
            }
            try {
              resolve(
                JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown,
              );
            } catch {
              reject(new Error('invalid_json'));
            }
          });
        },
      );
      // Limite absoluto: também cobre DNS, conexão e handshake TLS.
      const timer = setTimeout(() => req.destroy(new Error('timeout')), 10_000);
      req.on('close', () => clearTimeout(timer));
      req.on('error', reject);
      req.end(body);
    });
  }
}
