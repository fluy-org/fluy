import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Env } from '@/config/env.schema';
import type {
  NotificacaoPagamento,
  WebhookPagamentoInput,
} from '@/modules/pagamento/contracts';
import {
  efiPaymentSchema,
  normalizarPagamentoEfi,
} from '@/shared/providers/payment/efi/efi-payment.mapper';

@Injectable()
export class EfiWebhookAdapter {
  constructor(private readonly config: ConfigService<Env, true>) {}

  parseNotification(input: WebhookPagamentoInput): NotificacaoPagamento | null {
    const credential = input.query.hmac;
    const secret = this.config.get('EFI_WEBHOOK_SECRET', { infer: true });
    if (
      !secret ||
      typeof credential !== 'string' ||
      Buffer.byteLength(credential) !== Buffer.byteLength(secret) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(credential))
    ) {
      throw new UnauthorizedException('Notificação não autenticada.');
    }
    if (
      !input.body ||
      typeof input.body !== 'object' ||
      Object.keys(input.body).length === 0
    ) {
      return null;
    }
    const rawPayload =
      'pagamento' in input.body &&
      (input.body as Record<string, unknown>).pagamento &&
      typeof (input.body as Record<string, unknown>).pagamento === 'object'
        ? (input.body as Record<string, unknown>).pagamento
        : input.body;

    const result = efiPaymentSchema.safeParse(rawPayload);
    if (!result.success)
      throw new BadRequestException('Notificação de pagamento inválida.');
    return normalizarPagamentoEfi(result.data);
  }
}
