import type { ClerkClient } from '@clerk/backend';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { ClerkAuthenticator } from '@/shared/providers/clerk/clerk-authenticator.provider';

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
