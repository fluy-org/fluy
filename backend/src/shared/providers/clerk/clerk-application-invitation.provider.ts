import type { ClerkClient } from '@clerk/backend';
import { Inject, Injectable } from '@nestjs/common';
import {
  type ApplicationInvitation,
  type ApplicationInvitationProvider,
  type CreateApplicationInvitationInput,
  type FindApplicationInvitationInput,
} from '@/shared/providers/clerk/contracts';
import { OWNER_INVITATION_METADATA_KEY } from '@/modules/auth/contracts';
import { CLERK_CLIENT } from '@/shared/providers/clerk/clerk-client.provider';

@Injectable()
export class ClerkApplicationInvitationProvider implements ApplicationInvitationProvider {
  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
  ) {}

  async create(
    input: CreateApplicationInvitationInput,
  ): Promise<ApplicationInvitation> {
    const invitation = await this.clerkClient.invitations.createInvitation({
      emailAddress: input.emailAddress,
      expiresInDays: input.expiresInDays,
      ignoreExisting: false,
      notify: false,
      publicMetadata: {
        [OWNER_INVITATION_METADATA_KEY]: input.ownerInvitationEvidence,
      },
      redirectUrl: input.redirectUrl,
    });

    return toApplicationInvitation(invitation);
  }

  async findPending(
    input: FindApplicationInvitationInput,
  ): Promise<ApplicationInvitation | undefined> {
    const invitations = await this.clerkClient.invitations.getInvitationList({
      limit: 100,
      query: input.emailAddress,
      status: 'pending',
    });
    const invitation = invitations.data.find(
      (candidate) =>
        candidate.emailAddress.trim().toLowerCase() === input.emailAddress &&
        (input.referenceId === undefined ||
          obterReferencia(candidate.publicMetadata) === input.referenceId),
    );

    return invitation ? toApplicationInvitation(invitation) : undefined;
  }

  async revoke(invitationId: string): Promise<void> {
    try {
      await this.clerkClient.invitations.revokeInvitation(invitationId);
    } catch (error) {
      const invitation = await this.findById(invitationId);

      if (invitation && invitation.status !== 'pending') {
        return;
      }

      throw error;
    }
  }

  private async findById(invitationId: string) {
    for (const status of [
      'pending',
      'accepted',
      'revoked',
      'expired',
    ] as const) {
      const invitations = await this.clerkClient.invitations.getInvitationList({
        limit: 1,
        query: invitationId,
        status,
      });
      const invitation = invitations.data.find(
        (candidate) => candidate.id === invitationId,
      );

      if (invitation) {
        return invitation;
      }
    }

    return undefined;
  }
}

function toApplicationInvitation(invitation: {
  id: string;
  emailAddress: string;
  url?: string;
  expiresAt?: Date;
}): ApplicationInvitation {
  return {
    id: invitation.id,
    emailAddress: invitation.emailAddress.trim().toLowerCase(),
    url: invitation.url ?? null,
    expiresAt: invitation.expiresAt ?? null,
  };
}

function obterReferencia(
  publicMetadata: Record<string, unknown> | null | undefined,
): string | undefined {
  const metadata = publicMetadata?.[OWNER_INVITATION_METADATA_KEY];

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const referencia = (metadata as Record<string, unknown>)['referencia'];
  return typeof referencia === 'string' ? referencia : undefined;
}
