import type { ProvedorAutenticacao } from '@fluy/schema';

export const AUTHENTICATION_PROVIDER = Symbol('AUTHENTICATION_PROVIDER');

export type AuthenticatedIdentity = {
  provider: ProvedorAutenticacao;
  subject: string;
};

export type AuthenticationProfile = {
  nome: string | null;
  sobrenome: string | null;
  email: string | null;
  emailVerified: boolean;
};

export interface AuthenticationProvider {
  authenticate(accessToken: string): Promise<AuthenticatedIdentity>;
  getProfile(identity: AuthenticatedIdentity): Promise<AuthenticationProfile>;
}
