import { ConflictException, NotFoundException } from '@nestjs/common';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';
import type { IniciarPagamentoInput } from '@/modules/pagamento/contracts/pagamento-repository.types';

describe('PagamentoService', () => {
  const repository = {
    buscarReserva: jest.fn(),
    buscarTentativaAtiva: jest.fn(),
    criarOuBuscarTentativa: jest.fn<
      Promise<unknown>,
      [
        IniciarPagamentoInput & {
          idempotencyKey: string;
        },
      ]
    >(),
    marcarPendente: jest.fn(),
    aplicarNotificacao: jest.fn(),
    buscarPagamento: jest.fn(),
    buscarCobrancaPorId: jest.fn(),
  };
  const recebimentoPix = { buscar: jest.fn() };
  const provider = {
    quotePix: jest.fn(),
    createPixPayment: jest.fn<Promise<unknown>, [{ idempotencyKey: string }]>(),
  };
  const service = new PagamentoService(
    repository as never,
    recebimentoPix as never,
    provider as never,
  );
  const entrada = {
    salaoId: 'salao-a',
    clienteId: 'cliente-a',
    agendamentoId: 'reserva-a',
    modalidade: 'sinal' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.buscarReserva.mockResolvedValue({
      id: 'reserva-a',
      salao_id: 'salao-a',
      cliente_id: 'cliente-a',
      estado: 'reservado',
      preco_total: '100.00',
      valor_sinal: '25.00',
      expira_em: new Date('2030-01-01T00:15:00.000Z'),
    });
    repository.buscarTentativaAtiva.mockResolvedValue(undefined);
    recebimentoPix.buscar.mockResolvedValue({
      pix_tipo_chave: 'email',
      pix_chave: 'salao@example.com',
      pix_nome_recebedor: 'Salão A',
    });
    provider.quotePix.mockResolvedValue({
      valorSalaoCentavos: 2500,
      taxaClienteCentavos: 100,
      totalClienteCentavos: 2600,
    });
    repository.criarOuBuscarTentativa.mockImplementation((input) =>
      Promise.resolve({
        id: 'cobranca-a',
        idempotency_key: input.idempotencyKey,
        status: 'iniciando',
        modalidade: input.modalidade,
        valor: '25.00',
        taxa_cliente: '1.00',
        total_cliente: '26.00',
        pix_tipo_chave: 'email',
        pix_chave: 'salao@example.com',
        pix_nome_recebedor: 'Salão A',
      }),
    );
    provider.createPixPayment.mockResolvedValue({
      externalId: 'externo-a',
      status: 'pendente',
      instrucaoCliente: null,
    });
    repository.marcarPendente.mockResolvedValue({
      id: 'cobranca-a',
      status: 'pendente',
    });
  });

  it('inicia com preço do salão congelado, taxa separada e chave persistida', async () => {
    await service.iniciar({
      ...entrada,
      agora: new Date('2030-01-01T00:00:00.000Z'),
    });

    expect(repository.buscarReserva).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      clienteId: 'cliente-a',
      id: 'reserva-a',
    });
    expect(provider.quotePix).toHaveBeenCalledWith({
      valorSalaoCentavos: 2500,
      recebedor: {
        tipoChave: 'email',
        chave: 'salao@example.com',
        nomeRecebedor: 'Salão A',
      },
    });
    const tentativa = repository.criarOuBuscarTentativa.mock.calls[0][0];
    expect(tentativa).toMatchObject({
      salaoId: 'salao-a',
      agendamentoId: 'reserva-a',
      modalidade: 'sinal',
      valorSalaoCentavos: 2500,
      taxaClienteCentavos: 100,
      totalClienteCentavos: 2600,
    });
    expect(tentativa.idempotencyKey).toBeTruthy();
    expect(provider.createPixPayment.mock.calls[0][0].idempotencyKey).toBe(
      tentativa.idempotencyKey,
    );
    expect(repository.marcarPendente).toHaveBeenCalledWith({
      salaoId: 'salao-a',
      cobrancaId: 'cobranca-a',
      externalId: 'externo-a',
      instrucaoCliente: null,
    });
  });

  it('retorna a tentativa ativa sem nova cotação', async () => {
    repository.buscarTentativaAtiva.mockResolvedValue({
      id: 'cobranca-existente',
      status: 'pendente',
      modalidade: 'sinal',
    });

    await expect(
      service.iniciar({
        ...entrada,
        agora: new Date('2030-01-01T00:00:00.000Z'),
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'cobranca-existente' }));
    expect(provider.quotePix).not.toHaveBeenCalled();
    expect(repository.criarOuBuscarTentativa).not.toHaveBeenCalled();
  });

  it('não cria pagamento para reserva alheia ou expirada', async () => {
    repository.buscarReserva.mockResolvedValueOnce(undefined);
    await expect(
      service.iniciar({
        ...entrada,
        agora: new Date('2030-01-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.iniciar({
        ...entrada,
        agora: new Date('2030-01-01T00:15:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(provider.quotePix).not.toHaveBeenCalled();
  });

  it('mantém a mesma chave após falha da chamada ao fake', async () => {
    provider.createPixPayment.mockRejectedValueOnce(new Error('timeout'));
    await expect(
      service.iniciar({
        ...entrada,
        agora: new Date('2030-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('timeout');

    const primeiraChave =
      provider.createPixPayment.mock.calls[0][0].idempotencyKey;
    repository.buscarTentativaAtiva.mockResolvedValueOnce({
      id: 'cobranca-a',
      idempotency_key: primeiraChave,
      status: 'iniciando',
      modalidade: 'sinal',
      valor: '25.00',
      taxa_cliente: '1.00',
      total_cliente: '26.00',
      pix_tipo_chave: 'email',
      pix_chave: 'salao@example.com',
      pix_nome_recebedor: 'Salão A',
    });

    await service.iniciar({
      ...entrada,
      agora: new Date('2030-01-01T00:00:00.000Z'),
    });
    expect(provider.createPixPayment.mock.calls[1][0].idempotencyKey).toBe(
      primeiraChave,
    );
  });

  it('consulta somente pagamento da reserva pertencente à cliente', async () => {
    repository.buscarPagamento.mockResolvedValueOnce({ id: 'cobranca-a' });
    await expect(service.consultar(entrada)).resolves.toEqual({
      id: 'cobranca-a',
    });
    expect(repository.buscarPagamento).toHaveBeenCalledWith({
      salaoId: entrada.salaoId,
      clienteId: entrada.clienteId,
      agendamentoId: entrada.agendamentoId,
    });
    repository.buscarPagamento.mockResolvedValueOnce(undefined);
    await expect(service.consultar(entrada)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('processa notificação normalizada dentro do salão indicado', async () => {
    const notificacao = {
      eventId: 'evento-a',
      externalPaymentId: 'externo-a',
      tipo: 'confirmado' as const,
      ocorridoEm: new Date(),
      valorPagoCentavos: 2600,
    };
    await service.processarNotificacao({ salaoId: 'salao-a', notificacao });
    expect(repository.aplicarNotificacao).toHaveBeenCalledWith(
      expect.objectContaining({ salaoId: 'salao-a', notificacao }),
    );
  });

  it('transforma valor divergente da transação em conflito HTTP', async () => {
    repository.aplicarNotificacao.mockResolvedValueOnce('valor_divergente');
    await expect(
      service.processarNotificacao({
        salaoId: 'salao-a',
        notificacao: {
          eventId: 'evento-a',
          externalPaymentId: 'externo-a',
          tipo: 'confirmado',
          ocorridoEm: new Date(),
          valorPagoCentavos: 1,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
