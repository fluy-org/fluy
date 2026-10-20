jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_MINUTE: '* * * * *' },
}));

import { PagamentoExpiracaoService } from '@/modules/pagamento/pagamento-expiracao.service';

describe('PagamentoExpiracaoService', () => {
  it('encerra reservas vencidas por salão', async () => {
    const repository = {
      listarSalaos: jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]),
      expirarReservasDoSalao: jest.fn().mockResolvedValue(1),
    };
    const service = new PagamentoExpiracaoService(repository as never);
    await service.processar(new Date('2030-01-01T00:00:00.000Z'));
    expect(repository.expirarReservasDoSalao).toHaveBeenCalledTimes(2);
    expect(repository.expirarReservasDoSalao).toHaveBeenCalledWith({
      salaoId: 'a',
      agora: new Date('2030-01-01T00:00:00.000Z'),
    });
  });
});
