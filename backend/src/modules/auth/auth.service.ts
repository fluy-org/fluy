import { Inject, Injectable } from '@nestjs/common';
import {
  AUTHENTICATION_PROVIDER,
  type AuthenticatedIdentity,
  type AuthenticationProfile,
  type AuthenticationProvider,
} from './contracts';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTHENTICATION_PROVIDER)
    private readonly authenticationProvider: AuthenticationProvider,
  ) {}

  authenticate(accessToken: string): Promise<AuthenticatedIdentity> {
    return this.authenticationProvider.authenticate(accessToken);
  }

  getProfile(identity: AuthenticatedIdentity): Promise<AuthenticationProfile> {
    return this.authenticationProvider.getProfile(identity);
  }
}
