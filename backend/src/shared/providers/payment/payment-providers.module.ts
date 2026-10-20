import { Global, Module, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '@/modules/pagamento/contracts/payment-provider.types';
import { PAYMENT_SIMULATOR } from '@/modules/pagamento/contracts/payment-simulator.types';
import { FakePaymentProvider } from '@/shared/providers/payment/fake-payment.provider';

const disabledProvider: PaymentProvider = {
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
    { provide: PAYMENT_SIMULATOR, useExisting: FakePaymentProvider },
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, FakePaymentProvider],
      useFactory: (
        config: ConfigService<Env, true>,
        fake: FakePaymentProvider,
      ): PaymentProvider =>
        config.get('PAYMENT_PROVIDER', { infer: true }) === 'fake'
          ? fake
          : disabledProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER, PAYMENT_SIMULATOR],
})
export class PaymentProvidersModule {}
