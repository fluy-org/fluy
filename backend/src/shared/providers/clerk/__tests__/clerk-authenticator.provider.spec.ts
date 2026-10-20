import { verifyToken, type ClerkClient } from '@clerk/backend';
import { Logger, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { ClerkAuthenticator } from '../clerk-authenticator.provider';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkAuthenticator', () => {
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
  ] as const)('valida tokens em %s com tolerancia de %i ms', async (env, skew) => {
    verifyTokenMock.mockResolvedValue({
      sub: 'user_123',
    } as Awaited<ReturnType<typeof verifyToken>>);

    await expect(createAuthenticator(env).authenticate('session-token')).resolves.toEqual({
      provider: 'clerk',
      subject: 'user_123',
    });
    expect(verifyTokenMock).toHaveBeenCalledWith('session-token', {
      secretKey: 'sk_test_example',
      authorizedParties: ['http://localhost:4200'],
      clockSkewInMs: skew,
    });
  });

  it('rejeita tokens invalidos e registra apenas o motivo, sem o token', async () => {
    verifyTokenMock.mockRejectedValue(Object.assign(new Error('Invalid signature'), {
      reason: 'token-invalid-signature',
    }));

    await expect(createAuthenticator('development').authenticate('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(Logger.prototype.warn).toHaveBeenCalledWith({
      message: 'Clerk token verification failed',
      reason: 'token-invalid-signature',
    });
  });

  it('rejeita dados sem identidade de usuario', async () => {
    verifyTokenMock.mockResolvedValue({
      sub: '',
    } as Awaited<ReturnType<typeof verifyToken>>);

    await expect(createAuthenticator('development').authenticate('session-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
