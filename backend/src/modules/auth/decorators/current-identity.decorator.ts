import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedIdentity } from '../contracts';

type AuthenticatedRequest = Request & {
  authenticatedIdentity?: AuthenticatedIdentity;
};

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedIdentity => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authenticatedIdentity!;
  },
);
