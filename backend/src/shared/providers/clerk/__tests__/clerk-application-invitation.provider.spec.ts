import type { ClerkClient } from '@clerk/backend';
import { ClerkApplicationInvitationProvider } from '@/shared/providers/clerk/clerk-application-invitation.provider';

describe('ClerkApplicationInvitationProvider', () => {
  const createInvitation = jest.fn();
  const getInvitationList = jest.fn();
  const revokeInvitation = jest.fn();
  const clerkClient = {
    invitations: { createInvitation, getInvitationList, revokeInvitation },
  } as unknown as ClerkClient;
  const provider = new ClerkApplicationInvitationProvider(clerkClient);
  const evidencia = {
    versao: 1 as const,
    referencia: '7d5c96a7-c33a-4e76-8ae8-f57558577e53',
    assinaturaEmail: 'a'.repeat(64),
  };

  beforeEach(() => jest.resetAllMocks());

  it('cria convite sem notificação e com metadata exclusiva do backend', async () => {
    createInvitation.mockResolvedValue({
      id: 'inv_123',
      emailAddress: 'ana@example.com',
      url: 'https://accounts.example/invitations/accept?ticket=segredo',
    });

    await provider.create({
      emailAddress: 'ana@example.com',
      expiresInDays: 7,
      redirectUrl: 'https://fluy.example/convite',
      ownerInvitationEvidence: evidencia,
    });

    expect(createInvitation).toHaveBeenCalledWith({
      emailAddress: 'ana@example.com',
      expiresInDays: 7,
      ignoreExisting: false,
      notify: false,
      publicMetadata: { fluy_convite_proprietario: evidencia },
      redirectUrl: 'https://fluy.example/convite',
    });
  });

  it('encontra somente convite pendente com e-mail e referência exatos', async () => {
    getInvitationList.mockResolvedValue({
      data: [
        {
          id: 'inv_123',
          emailAddress: 'ana@example.com',
          publicMetadata: { fluy_convite_proprietario: evidencia },
          url: 'https://accounts.example/invitations/accept?ticket=segredo',
        },
      ],
    });

    await expect(
      provider.findPending({
        emailAddress: 'ana@example.com',
        referenceId: evidencia.referencia,
      }),
    ).resolves.toMatchObject({ id: 'inv_123' });
  });

  it('encontra qualquer convite pendente do e-mail para diagnosticar duplicidade', async () => {
    getInvitationList.mockResolvedValue({
      data: [
        {
          id: 'inv_comum',
          emailAddress: 'ana@example.com',
          publicMetadata: {},
        },
      ],
    });

    await expect(
      provider.findPending({ emailAddress: 'ana@example.com' }),
    ).resolves.toMatchObject({ id: 'inv_comum' });
  });

  it('revoga o convite no Clerk', async () => {
    revokeInvitation.mockResolvedValue({ id: 'inv_123' });

    await expect(provider.revoke('inv_123')).resolves.toBeUndefined();
  });
});
