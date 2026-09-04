import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DevelopmentAuthenticator } from '@/shared/providers/development/development-authenticator.provider';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';

describe('DevelopmentAuthenticator', () => {
  const token = 'token-local-com-mais-de-trinta-e-dois-caracteres';
  const config = {
    get: jest.fn(),
  } as unknown as ConfigService;
  const clerkAuthenticator = {
    getProfile: jest.fn(),
  } as unknown as ClerkAuthenticator;
  const authenticator = new DevelopmentAuthenticator(
    config as never,
    clerkAuthenticator,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(config, 'get').mockImplementation((chave) => {
      if (chave === 'DEV_AUTH_TOKEN') return token;
      if (chave === 'DEV_AUTH_SUBJECT') return 'user_local';

      return undefined;
    });
  });

  it('autentica apenas o token local configurado', async () => {
    await expect(authenticator.authenticate(token)).resolves.toEqual({
      provider: 'clerk',
      subject: 'user_local',
    });
  });

  it('rejeita token diferente do configurado', async () => {
    await expect(authenticator.authenticate('token-incorreto')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('delega a consulta de perfil ao Clerk', async () => {
    const perfil = {
      nome: 'Ana',
      sobrenome: null,
      email: 'ana@fluy.local',
      emailVerified: true,
    };
    jest.spyOn(clerkAuthenticator, 'getProfile').mockResolvedValue(perfil);

    await expect(
      authenticator.getProfile({ provider: 'clerk', subject: 'user_local' }),
    ).resolves.toEqual(perfil);
  });
});
