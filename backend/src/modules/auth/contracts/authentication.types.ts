import type { ProvedorAutenticacao } from '@fluy/schema';

export const AUTHENTICATION_PROVIDER = Symbol('AUTHENTICATION_PROVIDER');

export type AuthenticatedIdentity = {
  provider: ProvedorAutenticacao;
  subject: string;
};

export const OWNER_INVITATION_METADATA_KEY = 'fluy_convite_proprietario';
export const OWNER_INVITATION_FLOW_VERSION = 1;

export type OwnerInvitationEvidence = {
  versao: typeof OWNER_INVITATION_FLOW_VERSION;
  referencia: string;
  assinaturaEmail: string;
};

export type OwnerInvitationMetadata =
  | { status: 'ausente' }
  | { status: 'invalida' }
  | { status: 'valida'; evidencia: OwnerInvitationEvidence };

export type AuthenticationProfile = {
  nome: string | null;
  sobrenome: string | null;
  email: string | null;
  emailVerified: boolean;
  conviteProprietario: OwnerInvitationMetadata;
};

export interface AuthenticationProvider {
  authenticate(accessToken: string): Promise<AuthenticatedIdentity>;
  getProfile(identity: AuthenticatedIdentity): Promise<AuthenticationProfile>;
}
