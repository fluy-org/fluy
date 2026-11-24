import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class FluyThrottlerGuard extends ThrottlerGuard {
  protected override async getErrorMessage(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    if (
      throttlerLimitDetail.key.includes('identificacao') ||
      throttlerLimitDetail.tracker.includes('identificacao')
    ) {
      return 'Muitas tentativas de identificação. Aguarde alguns instantes e tente novamente.';
    }

    return 'Muitas requisições. Aguarde alguns instantes e tente novamente.';
  }

  protected override generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    if (name === 'identificacao_whatsapp') {
      const { req } = this.getRequestResponse(context);
      const whatsapp = req.body?.whatsapp;
      if (typeof whatsapp === 'string' && whatsapp.trim()) {
        return `identificacao_whatsapp-${whatsapp.trim()}`;
      }
    }

    return super.generateKey(context, suffix, name);
  }
}
