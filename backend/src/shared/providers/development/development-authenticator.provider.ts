import { timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type {
  AuthenticatedIdentity,
  AuthenticationProfile,
  AuthenticationProvider,
} from '@/modules/auth/contracts';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';

@Injectable()
export class DevelopmentAuthenticator implements AuthenticationProvider {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly clerkAuthenticator: ClerkAuthenticator,
  ) {}

  async authenticate(accessToken: string): Promise<AuthenticatedIdentity> {
    const tokenConfigurado = this.config.get('DEV_AUTH_TOKEN', {
      infer: true,
    });
    const subject = this.config.get('DEV_AUTH_SUBJECT', { infer: true });

    if (
      !tokenConfigurado ||
      !subject ||
      !tokensIguais(accessToken, tokenConfigurado)
    ) {
      throw new UnauthorizedException('Token de desenvolvimento inválido.');
    }

    return { provider: 'clerk', subject };
  }

  getProfile(identity: AuthenticatedIdentity): Promise<AuthenticationProfile> {
    return this.clerkAuthenticator.getProfile(identity);
  }
}

function tokensIguais(recebido: string, configurado: string): boolean {
  const tokenRecebido = Buffer.from(recebido);
  const tokenConfigurado = Buffer.from(configurado);

  return (
    tokenRecebido.length === tokenConfigurado.length &&
    timingSafeEqual(tokenRecebido, tokenConfigurado)
  );
}
