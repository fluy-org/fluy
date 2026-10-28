import { Global, Module, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '@/modules/pagamento/contracts';
import { PAYMENT_SIMULATOR } from '@/modules/pagamento/contracts';
import { FakePaymentProvider } from '@/shared/providers/payment/fake-payment.provider';

import { EfiClient } from '@/shared/providers/payment/efi/efi-client';
import { EfiTransport } from '@/shared/providers/payment/efi/efi-transport';
import { EfiPaymentProvider } from '@/shared/providers/payment/efi/efi-payment.provider';

import { EfiWebhookAdapter } from '@/shared/providers/payment/efi/efi-webhook.adapter';

const disabledProvider: PaymentProvider = {
  name: 'disabled',
  quotePix: () =>
    Promise.reject(
      new ServiceUnavailableException('Pagamento online indisponível.'),
    ),
  createPixPayment: () =>
    Promise.reject(
      new ServiceUnavailableException('Pagamento online indisponível.'),
    ),
};

@Global()
@Module({
  providers: [
    FakePaymentProvider,
    EfiTransport,
    EfiClient,
    EfiPaymentProvider,
    EfiWebhookAdapter,
    { provide: PAYMENT_SIMULATOR, useExisting: FakePaymentProvider },
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, FakePaymentProvider, EfiPaymentProvider],
      useFactory: (
        config: ConfigService<Env, true>,
        fake: FakePaymentProvider,
        efi: EfiPaymentProvider,
      ): PaymentProvider =>
        config.get('PAYMENT_PROVIDER', { infer: true }) === 'fake'
          ? fake
          : config.get('PAYMENT_PROVIDER', { infer: true }) === 'efi'
            ? efi
            : disabledProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER, PAYMENT_SIMULATOR],
})
export class PaymentProvidersModule {}
