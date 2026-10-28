import { PagamentoService } from '@/modules/pagamento/pagamento.service';

describe('PagamentoService com provider externo', () => {
  const pagador = {
    cpf: '51687574219',
    instituicao_id: '9f4cd202-8f2b-11ec-b909-0242ac120002',
  };
  const cobranca = {
    id: 'c1',
    id_externo: 'externo',
    provedor: 'fake',
    idempotency_key: 'key',
    status: 'iniciando',
    modalidade: 'sinal',
    valor: '25.00',
    taxa_cliente: '0.00',
    total_cliente: '25.00',
    pix_tipo_chave: 'email',
    pix_chave: 'a@example.com',
    pix_nome_recebedor: 'Salão',
    pagador,
    criada_em: new Date(),
  };
  const repo = {
    buscarReserva: jest.fn(),
    buscarTentativaAtiva: jest.fn(),
    marcarPendente: jest.fn(),
    buscarPagamento: jest.fn(),
    aplicarNotificacao: jest.fn(),
  };
  const provider = {
    name: 'fake',
    requiresPayer: true,
    createPixPayment: jest.fn(),
    getPixPayment: jest.fn(),
  };
  const service = new PagamentoService(
    repo as never,
    {} as never,
    provider as never,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    repo.buscarReserva.mockResolvedValue({
      estado: 'reservado',
      expira_em: new Date(Date.now() + 60000),
    });
    repo.buscarTentativaAtiva.mockResolvedValue(cobranca);
    provider.createPixPayment.mockResolvedValue({
      externalId: 'externo',
      instrucaoCliente: { tipo: 'url', valor: 'https://bank.example' },
    });
    repo.marcarPendente.mockResolvedValue({ ...cobranca, status: 'pendente' });
  });
  const scope = { salaoId: 's1', clienteId: 'cl1', agendamentoId: 'a1' };
  it('rejeita ausência de pagador antes de persistir nova tentativa', async () => {
    repo.buscarTentativaAtiva.mockResolvedValueOnce(undefined);
    await expect(
      service.iniciar({ ...scope, modalidade: 'sinal' }),
    ).rejects.toThrow('Informe os dados do pagador.');
  });
  it('retenta com dados congelados do pagador e não com dados novos', async () => {
    await service.iniciar({
      ...scope,
      modalidade: 'sinal',
      pagador: { ...pagador, cpf: '11111111111' },
    });
    expect(provider.createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({ pagador, idempotencyKey: 'key' }),
    );
  });
  it('consulta o banco somente depois de autorizar o escopo e usa confirmação existente', async () => {
    repo.buscarPagamento
      .mockResolvedValueOnce({ ...cobranca, status: 'pendente' })
      .mockResolvedValueOnce({ ...cobranca, status: 'confirmada' });
    const notification = {
      externalPaymentId: 'externo',
      provider: 'fake',
      eventId: 'e1',
      tipo: 'confirmado',
      valorPagoCentavos: 2500,
      ocorridoEm: new Date(),
    };
    provider.getPixPayment.mockResolvedValue(notification);
    expect(await service.consultar(scope)).toMatchObject({
      status: 'confirmada',
    });
    expect(repo.aplicarNotificacao).toHaveBeenCalledWith(
      expect.objectContaining({ salaoId: 's1', notificacao: notification }),
    );
    repo.buscarPagamento.mockResolvedValueOnce(undefined);
    await expect(service.consultar(scope)).rejects.toThrow();
    expect(provider.getPixPayment).toHaveBeenCalledTimes(1);
  });
});
