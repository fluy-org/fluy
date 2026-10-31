import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { validarEvidenciaConviteProprietario } from '@/modules/auth/owner-invitation-evidence';
import { ConviteProprietarioService } from '@/modules/convite-proprietario/convite-proprietario.service';
import type { ApplicationInvitationProvider } from '@/shared/providers/clerk/contracts';

describe('ConviteProprietarioService', () => {
  const segredo = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';
  const invitation = {
    id: 'inv_123',
    emailAddress: 'ana@example.com',
    url: 'https://accounts.example/invitations/accept?ticket=segredo',
    expiresAt: new Date('2026-10-21T12:00:00.000Z'),
  };
  const invitationProvider = {
    create: jest.fn(),
    findPending: jest.fn(),
    revoke: jest.fn(),
  } as unknown as ApplicationInvitationProvider;
  const config = {
    get: jest.fn((key: keyof Env) => {
      if (key === 'OWNER_INVITE_REDIRECT_URL') {
        return 'https://fluy.example/convite';
      }
      if (key === 'OWNER_INVITE_METADATA_SECRET') {
        return segredo;
      }
      if (key === 'OWNER_INVITE_DEFAULT_EXPIRATION_DAYS') {
        return 7;
      }
      return undefined;
    }),
  } as unknown as ConfigService<Env, true>;
  const service = new ConviteProprietarioService(invitationProvider, config);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('emite diretamente no Clerk com metadata assinada pelo backend', async () => {
    const create = jest
      .spyOn(invitationProvider, 'create')
      .mockResolvedValue(invitation);

    await expect(
      service.emitir({ email: ' Ana@Example.com ' }),
    ).resolves.toEqual({
      status: 'emitido',
      clerkConviteId: invitation.id,
      email: invitation.emailAddress,
      expiraEm: invitation.expiresAt,
      url: invitation.url,
    });

    const input = create.mock.calls[0]?.[0];

    if (!input) {
      throw new Error('O convite deveria ter sido enviado ao provider.');
    }
    expect(input).toMatchObject({
      emailAddress: 'ana@example.com',
      expiresInDays: 7,
      redirectUrl: 'https://fluy.example/convite',
      ownerInvitationEvidence: { versao: 1 },
    });
    expect(
      validarEvidenciaConviteProprietario({
        evidencia: input.ownerInvitationEvidence,
        email: 'ana@example.com',
        segredo,
      }),
    ).toBe(true);
  });

  it('recupera resposta ambígua procurando a mesma referência no Clerk', async () => {
    jest
      .spyOn(invitationProvider, 'create')
      .mockRejectedValue(new Error('timeout'));
    const findPending = jest
      .spyOn(invitationProvider, 'findPending')
      .mockResolvedValueOnce(invitation);

    await expect(
      service.emitir({ email: invitation.emailAddress }),
    ).resolves.toMatchObject({ status: 'emitido', url: invitation.url });

    const busca = findPending.mock.calls[0]?.[0];
    expect(busca?.emailAddress).toBe(invitation.emailAddress);
    expect(typeof busca?.referenceId).toBe('string');
  });

  it('informa duplicidade quando o Clerk já tem convite pendente no e-mail', async () => {
    jest
      .spyOn(invitationProvider, 'create')
      .mockRejectedValue(new Error('already invited'));
    jest
      .spyOn(invitationProvider, 'findPending')
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(invitation);

    await expect(
      service.emitir({ email: invitation.emailAddress }),
    ).resolves.toMatchObject({
      status: 'duplicado',
      clerkConviteId: invitation.id,
    });
  });

  it('não cria registro local quando o Clerk falha', async () => {
    jest
      .spyOn(invitationProvider, 'create')
      .mockRejectedValue(new Error('indisponível'));
    jest.spyOn(invitationProvider, 'findPending').mockResolvedValue(undefined);

    await expect(
      service.emitir({ email: invitation.emailAddress }),
    ).resolves.toEqual({ status: 'falha_integracao' });
  });

  it('revoga diretamente pelo ID do Clerk', async () => {
    const revoke = jest
      .spyOn(invitationProvider, 'revoke')
      .mockResolvedValue(undefined);

    await expect(service.revogar(invitation.id)).resolves.toEqual({
      status: 'revogado',
    });
    expect(revoke).toHaveBeenCalledWith(invitation.id);
  });
});
