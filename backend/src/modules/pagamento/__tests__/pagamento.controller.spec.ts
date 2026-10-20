jest.mock('@/modules/pagamento/pagamento-publico.service', () => ({
  PagamentoPublicoService: class {},
}));
jest.mock('@/modules/pagamento/pagamento-simulacao.service', () => ({
  PagamentoSimulacaoService: class {},
}));
jest.mock('@/modules/pagamento/pagamento.mapper', () => ({
  toPagamentoPixResponse: (value: unknown) => value,
  toReservaPixResponse: (value: unknown) => value,
}));

import {
  PagamentoPublicoController,
  PagamentoFakeController,
} from '@/modules/pagamento/pagamento.controller';

describe('Rotas de pagamento', () => {
  const publicoService = {
    reservar: jest.fn(),
    iniciar: jest.fn(),
    consultar: jest.fn(),
  };
  const simulacaoService = { simular: jest.fn() };
  const publico = new PagamentoPublicoController(publicoService as never);
  const fake = new PagamentoFakeController(simulacaoService as never);
  const tenant = { salaoId: 'salao-a' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('repassa a reserva com o salão do contexto e o corpo validado', async () => {
    publicoService.reservar.mockResolvedValue({ id: 'reserva-a' });
    await expect(
      publico.reservar(tenant, { credencial: 'credencial-a' } as never),
    ).resolves.toEqual({ id: 'reserva-a' });
    expect(publicoService.reservar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      dados: { credencial: 'credencial-a' },
    });
  });

  it('repassa o agendamento e o contexto do salão à cobrança', async () => {
    publicoService.iniciar.mockResolvedValue({ id: 'cobranca-a' });
    await publico.iniciar(tenant, 'reserva-a', {
      credencial: 'credencial-a',
      modalidade: 'sinal',
    });
    expect(publicoService.iniciar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      agendamentoId: 'reserva-a',
      dados: { credencial: 'credencial-a', modalidade: 'sinal' },
    });
  });

  it('repassa a consulta com a credencial da cliente', async () => {
    await publico.consultar(tenant, 'reserva-a', {
      credencial: 'credencial-a',
    });
    expect(publicoService.consultar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      agendamentoId: 'reserva-a',
      credencial: 'credencial-a',
    });
  });

  it('repassa a simulação com o salão autenticado', async () => {
    await expect(
      fake.simular(tenant, 'cobranca-a', { resultado: 'confirmado' }),
    ).resolves.toEqual({ processado: true });
    expect(simulacaoService.simular).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      cobrancaId: 'cobranca-a',
      resultado: 'confirmado',
    });
  });
});
