import { verifyToken, type ClerkClient } from '@clerk/backend';
import { Logger, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkAuthenticator.authenticate', () => {
  const verifyTokenMock = jest.mocked(verifyToken);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  function createAuthenticator(nodeEnv: Env['NODE_ENV']) {
    const values = {
      NODE_ENV: nodeEnv,
      CLERK_SECRET_KEY: 'sk_test_example',
      CLERK_AUTHORIZED_PARTIES: ['http://localhost:4200'],
    };
    const config = {
      get: jest.fn((key: keyof typeof values) => values[key]),
    } as unknown as ConfigService<Env, true>;

    return new ClerkAuthenticator({} as ClerkClient, config);
  }

  it.each([
    ['development', 90_000],
    ['production', 5_000],
    ['test', 5_000],
  ] as const)(
    'valida tokens em %s com tolerância de %i ms',
    async (env, skew) => {
      verifyTokenMock.mockResolvedValue({
        sub: 'user_123',
      } as Awaited<ReturnType<typeof verifyToken>>);

      await expect(
        createAuthenticator(env).authenticate('session-token'),
      ).resolves.toEqual({
        provider: 'clerk',
        subject: 'user_123',
      });
      expect(verifyTokenMock).toHaveBeenCalledWith('session-token', {
        secretKey: 'sk_test_example',
        authorizedParties: ['http://localhost:4200'],
        clockSkewInMs: skew,
      });
    },
  );

  it('rejeita tokens inválidos e registra apenas o motivo, sem o token', async () => {
    verifyTokenMock.mockRejectedValue(
      Object.assign(new Error('Invalid signature'), {
        reason: 'token-invalid-signature',
      }),
    );

    await expect(
      createAuthenticator('development').authenticate('invalid-token'),
    ).rejects.toThrow(UnauthorizedException);
    expect(Logger.prototype.warn).toHaveBeenCalledWith({
      message: 'Clerk token verification failed',
      reason: 'token-invalid-signature',
    });
  });

  it('rejeita dados sem identidade de usuário', async () => {
    verifyTokenMock.mockResolvedValue({
      sub: '',
    } as Awaited<ReturnType<typeof verifyToken>>);

    await expect(
      createAuthenticator('development').authenticate('session-token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('ClerkAuthenticator.getProfile', () => {
  const getUser = jest.fn();
  const clerkClient = { users: { getUser } } as unknown as ClerkClient;
  const config = {} as ConfigService<Env, true>;
  const provider = new ClerkAuthenticator(clerkClient, config);
  const evidencia = {
    versao: 1,
    referencia: '7d5c96a7-c33a-4e76-8ae8-f57558577e53',
    assinaturaEmail: 'a'.repeat(64),
  };

  beforeEach(() => jest.resetAllMocks());

  it('obtém o perfil e a evidência diretamente da API do Clerk', async () => {
    getUser.mockResolvedValue(
      criarUsuarioClerk({ fluy_convite_proprietario: evidencia }),
    );

    await expect(
      provider.getProfile({ provider: 'clerk', subject: 'user_123' }),
    ).resolves.toEqual({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      emailVerified: true,
      conviteProprietario: { status: 'valida', evidencia },
    });
  });

  it('distingue convite comum sem metadata de proprietário', async () => {
    getUser.mockResolvedValue(criarUsuarioClerk({ outro_dado: true }));

    await expect(
      provider.getProfile({ provider: 'clerk', subject: 'user_123' }),
    ).resolves.toMatchObject({ conviteProprietario: { status: 'ausente' } });
  });

  it('marca metadata de proprietário malformada como inválida', async () => {
    getUser.mockResolvedValue(
      criarUsuarioClerk({
        fluy_convite_proprietario: { ...evidencia, versao: 999 },
      }),
    );

    await expect(
      provider.getProfile({ provider: 'clerk', subject: 'user_123' }),
    ).resolves.toMatchObject({ conviteProprietario: { status: 'invalida' } });
  });
});

function criarUsuarioClerk(publicMetadata: Record<string, unknown>) {
  return {
    firstName: 'Ana',
    lastName: 'Silva',
    primaryEmailAddressId: 'email_123',
    emailAddresses: [
      {
        id: 'email_123',
        emailAddress: 'ana@example.com',
        verification: { status: 'verified' },
      },
    ],
    publicMetadata,
  };
}
