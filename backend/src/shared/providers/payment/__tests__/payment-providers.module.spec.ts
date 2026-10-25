import { Test } from '@nestjs/testing';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PaymentProvidersModule } from '../payment-providers.module';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '@/modules/pagamento/contracts/payment-provider.types';
import { EfiPaymentProvider } from '../efi/efi-payment.provider';
import { FakePaymentProvider } from '../fake-payment.provider';

describe('registro dos providers de pagamento', () => {
  it.each(['efi', 'fake', 'disabled'])(
    'resolve %s sem conectar ao banco',
    async (name) => {
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
          PaymentProvidersModule,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string) => (key === 'PAYMENT_PROVIDER' ? name : undefined),
        })
        .compile();
      const provider = module.get<PaymentProvider>(PAYMENT_PROVIDER);
      if (name === 'efi') expect(provider).toBeInstanceOf(EfiPaymentProvider);
      if (name === 'fake') expect(provider).toBeInstanceOf(FakePaymentProvider);
      if (name === 'disabled')
        await expect(
          provider.quotePix({
            valorSalaoCentavos: 100,
            recebedor: {
              tipoChave: 'email',
              chave: 'a@example.com',
              nomeRecebedor: 'A',
            },
          }),
        ).rejects.toThrow();
      await module.close();
    },
  );
});
