export const APPLICATION_INVITATION_PROVIDER = Symbol(
  'APPLICATION_INVITATION_PROVIDER',
);

export type ApplicationInvitation = {
  id: string;
  emailAddress: string;
  url: string | null;
  expiresAt: Date | null;
};

export type CreateApplicationInvitationInput = {
  emailAddress: string;
  expiresInDays: number;
  redirectUrl: string;
  ownerInvitationEvidence: OwnerInvitationEvidence;
};

export type FindApplicationInvitationInput = {
  emailAddress: string;
  referenceId?: string;
};

export interface ApplicationInvitationProvider {
  create(
    input: CreateApplicationInvitationInput,
  ): Promise<ApplicationInvitation>;
  findPending(
    input: FindApplicationInvitationInput,
  ): Promise<ApplicationInvitation | undefined>;
  revoke(invitationId: string): Promise<void>;
}
import type { OwnerInvitationEvidence } from '@/modules/auth/contracts';
