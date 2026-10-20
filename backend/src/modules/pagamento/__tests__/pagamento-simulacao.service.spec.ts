import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
jest.mock('@/modules/pagamento/pagamento.service', () => ({
  PagamentoService: class {},
}));
import { PagamentoSimulacaoService } from '@/modules/pagamento/pagamento-simulacao.service';

describe('PagamentoSimulacaoService', () => {
  const config = { get: jest.fn() };
  const repository = { buscarCobrancaPorId: jest.fn() };
  const simulador = { simulate: jest.fn() };
  const pagamento = {
    processarNotificacao: jest.fn<
      void,
      [{ salaoId: string; notificacao: { eventId: string }; agora: Date }]
    >(),
  };
  const service = new PagamentoSimulacaoService(
    config as never,
    repository as never,
    simulador,
    pagamento as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'development' : 'fake',
    );
  });

  it('bloqueia simulação fora de desenvolvimento', async () => {
    config.get.mockReturnValueOnce('production');
    await expect(
      service.simular({
        salaoId: 'salao-a',
        cobrancaId: 'cobranca-a',
        resultado: 'confirmado',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.buscarCobrancaPorId).not.toHaveBeenCalled();
  });

  it('exige cobrança do salão e repassa notificação normalizada', async () => {
    repository.buscarCobrancaPorId.mockResolvedValueOnce(undefined);
    await expect(
      service.simular({
        salaoId: 'salao-a',
        cobrancaId: 'cobranca-a',
        resultado: 'confirmado',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    repository.buscarCobrancaPorId.mockResolvedValueOnce({
      id_externo: 'externo-a',
    });
    simulador.simulate.mockReturnValueOnce({ eventId: 'evento-a' });
    await service.simular({
      salaoId: 'salao-a',
      cobrancaId: 'cobranca-a',
      resultado: 'confirmado',
    });
    const chamada = pagamento.processarNotificacao.mock.calls[0][0];
    expect(chamada).toMatchObject({
      salaoId: 'salao-a',
      notificacao: { eventId: 'evento-a' },
    });
    expect(chamada.agora).toBeInstanceOf(Date);
  });

  it('traduz erro do simulador sem processar notificação', async () => {
    repository.buscarCobrancaPorId.mockResolvedValueOnce({
      id_externo: 'externo-a',
    });
    simulador.simulate.mockReturnValueOnce({ erro: 'encerrado' });
    await expect(
      service.simular({
        salaoId: 'salao-a',
        cobrancaId: 'cobranca-a',
        resultado: 'confirmado',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pagamento.processarNotificacao).not.toHaveBeenCalled();
  });
});
