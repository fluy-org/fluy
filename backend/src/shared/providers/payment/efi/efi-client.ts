import { EfiTransport } from '@/shared/providers/payment/efi/efi-transport';
import type { RequestInput } from '@/shared/providers/payment/efi/contracts';
import {
  Injectable,
  ServiceUnavailableException,
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';

@Injectable()
export class EfiClient {
  private token?: { value: string; expiresAt: number };
  private authenticating?: Promise<string>;
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly transport: EfiTransport,
  ) {}
  private async authenticate(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now())
      return this.token.value;
    if (this.authenticating) return this.authenticating;
    this.authenticating = (async () => {
      const credentials = Buffer.from(
        `${this.config.get('EFI_CLIENT_ID', { infer: true })}:${this.config.get('EFI_CLIENT_SECRET', { infer: true })}`,
      ).toString('base64');
      const data = (await this.transport.send({
        method: 'POST',
        path: '/v1/oauth/token',
        headers: { Authorization: `Basic ${credentials}` },
        body: { grant_type: 'client_credentials' },
      })) as { access_token?: unknown; expires_in?: unknown };
      if (
        !data ||
        typeof data.access_token !== 'string' ||
        !data.access_token ||
        typeof data.expires_in !== 'number' ||
        !Number.isFinite(data.expires_in) ||
        data.expires_in <= 0
      )
        throw new BadGatewayException('Resposta de autenticação inválida.');
      this.token = {
        value: data.access_token,
        expiresAt: Date.now() + Math.max(0, data.expires_in - 30) * 1000,
      };
      return this.token.value;
    })();
    try {
      return await this.authenticating;
    } finally {
      this.authenticating = undefined;
    }
  }
  async request(input: RequestInput): Promise<unknown> {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = await this.authenticate();
        try {
          return await this.transport.send({
            ...input,
            headers: { ...input.headers, Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          const status = (error as { status?: number }).status;
          if (status === 401 && attempt === 0) {
            if (this.token?.value === token) this.token = undefined;
            continue;
          }
          if (status === 404 && input.method === 'GET')
            throw new NotFoundException('Registro não encontrado no provedor.');
          if (status === 400 || status === 409 || status === 422) {
            console.error(
              '[EFI CLIENT ERROR]',
              status,
              (error as { body?: string }).body,
            );
            throw new BadRequestException(
              'O provedor recusou os dados do pagamento.',
            );
          }
          throw error;
        }
      }
      throw new Error('authentication');
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new ServiceUnavailableException(
        'Comunicação com o provedor de pagamento indisponível.',
      );
    }
  }
}
