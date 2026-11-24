import { ExecutionContext } from '@nestjs/common';
import { FluyThrottlerGuard } from '@/shared/throttler/fluy-throttler.guard';

describe('FluyThrottlerGuard', () => {
  let guard: FluyThrottlerGuard;

  beforeEach(() => {
    guard = new FluyThrottlerGuard(
      { throttlers: [] } as any,
      {} as any,
      {} as any,
    );
  });

  describe('generateKey', () => {
    it('gera chave com o WhatsApp quando o throttler for identificacao_whatsapp', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: { whatsapp: ' +5511999999999 ' },
          }),
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // @ts-expect-error -- acessando método protegido para teste unitário
      const key = guard.generateKey(context, 'suffix', 'identificacao_whatsapp');

      expect(key).toBe('identificacao_whatsapp-+5511999999999');
    });

    it('delega para super.generateKey quando não for identificacao_whatsapp ou não tiver whatsapp no body', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {},
            ip: '127.0.0.1',
            headers: {},
          }),
          getResponse: () => ({}),
        }),
        getClass: () => class TestController {},
        getHandler: () => function testHandler() {},
      } as unknown as ExecutionContext;

      // @ts-expect-error -- acessando método protegido para teste unitário
      const key = guard.generateKey(context, 'suffix', 'default');

      expect(typeof key).toBe('string');
    });
  });

  describe('getErrorMessage', () => {
    it('retorna mensagem amigável em português para identificação', async () => {
      const context = {} as ExecutionContext;
      const detail = {
        key: 'identificacao_ip',
        tracker: 'ip',
        limit: 5,
        ttl: 60000,
        timeToExpire: 30000,
        totalHits: 6,
      };

      // @ts-expect-error -- acessando método protegido para teste unitário
      const msg = await guard.getErrorMessage(context, detail);

      expect(msg).toBe(
        'Muitas tentativas de identificação. Aguarde alguns instantes e tente novamente.',
      );
    });

    it('retorna mensagem geral amigável para outros throttlers', async () => {
      const context = {} as ExecutionContext;
      const detail = {
        key: 'default',
        tracker: 'ip',
        limit: 100,
        ttl: 60000,
        timeToExpire: 30000,
        totalHits: 101,
      };

      // @ts-expect-error -- acessando método protegido para teste unitário
      const msg = await guard.getErrorMessage(context, detail);

      expect(msg).toBe(
        'Muitas requisições. Aguarde alguns instantes e tente novamente.',
      );
    });
  });
});
