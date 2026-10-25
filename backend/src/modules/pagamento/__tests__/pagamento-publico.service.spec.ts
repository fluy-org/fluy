import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
jest.mock('@/modules/agendamento/agendamento-publico.service', () => ({
  AgendamentoPublicoService: class {},
}));
jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class {},
}));
jest.mock('@/modules/pagamento/pagamento.service', () => ({
  PagamentoService: class {},
}));
jest.mock('@/modules/salao-configuracao/recebimento-pix.service', () => ({
  RecebimentoPixService: class {},
}));
import { PagamentoPublicoService } from '@/modules/pagamento/pagamento-publico.service';

describe('PagamentoPublicoService', () => {
  const config = { get: jest.fn() };
  const cliente = { resolverSessaoPublica: jest.fn() };
  const agendamento = { reservar: jest.fn() };
  const pagamento = { iniciar: jest.fn(), consultar: jest.fn() };
  const recebimentoPix = { buscar: jest.fn() };
  const service = new PagamentoPublicoService(
    config as never,
    cliente as never,
    agendamento as never,
    pagamento as never,
    recebimentoPix as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('fake');
    cliente.resolverSessaoPublica.mockResolvedValue({ id: 'cliente-a' });
  });

  it('exige provedor e recebimento Pix antes de reservar', async () => {
    config.get.mockReturnValueOnce('disabled');
    await expect(
      service.reservar({ salaoId: 'salao-a', dados: {} as never }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(agendamento.reservar).not.toHaveBeenCalled();

    agendamento.reservar.mockResolvedValue({ id: 'reserva-a' });
    await service.reservar({ salaoId: 'salao-a', dados: {} as never });
    expect(recebimentoPix.buscar).toHaveBeenCalledWith('salao-a');
    expect(agendamento.reservar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      dados: {},
    });
  });

  it('inicia somente para a cliente da credencial no salão', async () => {
    pagamento.consultar.mockResolvedValue({ id: 'cobranca-a' });
    await service.iniciar({
      salaoId: 'salao-a',
      agendamentoId: 'reserva-a',
      dados: { credencial: 'credencial-a', modalidade: 'sinal' },
    });
    expect(pagamento.iniciar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      clienteId: 'cliente-a',
      agendamentoId: 'reserva-a',
      modalidade: 'sinal',
    });
    cliente.resolverSessaoPublica.mockResolvedValueOnce(undefined);
    await expect(
      service.consultar({
        salaoId: 'salao-a',
        agendamentoId: 'reserva-a',
        credencial: 'inválida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('devolve instrução de criação sem consultar banco antes da autorização', async () => {
    pagamento.consultar.mockResolvedValue({ id: 'cobranca-a' });
    await service.iniciar({
      salaoId: 'salao-a',
      agendamentoId: 'reserva-a',
      dados: { credencial: 'credencial-a', modalidade: 'sinal' },
    });
    expect(pagamento.consultar).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      clienteId: 'cliente-a',
      agendamentoId: 'reserva-a',
      sincronizar: false,
    });
  });
});
