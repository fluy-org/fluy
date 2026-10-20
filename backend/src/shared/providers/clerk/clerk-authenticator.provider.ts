import { verifyToken, type ClerkClient } from '@clerk/backend';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type {
  AuthenticatedIdentity,
  AuthenticationProfile,
  AuthenticationProvider,
} from '@/modules/auth/contracts';
import { CLERK_CLIENT } from '@/shared/providers/clerk/clerk-client.provider';

@Injectable()
export class ClerkAuthenticator implements AuthenticationProvider {
  private readonly logger = new Logger(ClerkAuthenticator.name);

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async authenticate(accessToken: string): Promise<AuthenticatedIdentity> {
    try {
      const payload = await verifyToken(accessToken, {
        secretKey: this.config.get('CLERK_SECRET_KEY', { infer: true }),
        authorizedParties: this.config.get('CLERK_AUTHORIZED_PARTIES', {
          infer: true,
        }),
        // Relogios locais podem divergir; producao mantem o limite do Clerk.
        clockSkewInMs:
          this.config.get('NODE_ENV', { infer: true }) === 'development'
            ? 90_000
            : 5_000,
      });

      if (
        !payload ||
        typeof payload.sub !== 'string' ||
        payload.sub.length === 0
      ) {
        throw new UnauthorizedException('Token Clerk inválido.');
      }

      return { provider: 'clerk', subject: payload.sub };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const reason =
        error && typeof error === 'object' && 'reason' in error
          ? String(error.reason)
          : 'unknown';
      this.logger.warn({ message: 'Clerk token verification failed', reason });

      throw new UnauthorizedException('Token Clerk inválido.');
    }
  }

  async getProfile(
    identity: AuthenticatedIdentity,
  ): Promise<AuthenticationProfile> {
    if (identity.provider !== 'clerk') {
      throw new UnprocessableEntityException(
        'Provedor de autenticação não suportado.',
      );
    }

    const user = await this.clerkClient.users.getUser(identity.subject);
    const email = user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
    );

    return {
      nome: user.firstName,
      sobrenome: user.lastName,
      email: email?.emailAddress ?? null,
      emailVerified: email?.verification?.status === 'verified',
    };
  }
}
