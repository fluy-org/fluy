import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import type { AuthenticatedIdentity } from '../contracts';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type AuthenticatedRequest = Request & {
  authenticatedIdentity?: AuthenticatedIdentity;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractAccessToken(request);

    request.authenticatedIdentity =
      await this.authService.authenticate(accessToken);
    return true;
  }

  private extractAccessToken(request: Request): string {
    const [scheme, accessToken] =
      request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Bearer token ausente ou inválido.');
    }

    return accessToken;
  }
}
