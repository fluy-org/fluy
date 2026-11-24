jest.mock('@/modules/salao/salao-consulta.service', () => ({
  SalaoConsultaService: class {},
}));
jest.mock('@/modules/salao-configuracao/salao-configuracao.service', () => ({
  SalaoConfiguracaoService: class {},
}));
jest.mock('@/modules/disponibilidade/disponibilidade.service', () => ({
  DisponibilidadeService: class {},
}));
jest.mock('@/modules/procedimento/procedimento.service', () => ({
  ProcedimentoService: class {},
}));
jest.mock('@/modules/salao-configuracao/recebimento-pix.service', () => ({
  RecebimentoPixService: class {},
}));
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { ConflictException } from '@nestjs/common';

jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class {},
}));
jest.mock('@/modules/aviso/agendamento-aviso.service', () => ({
  AgendamentoAvisoService: class {},
}));

describe('AgendamentoService: dispensa de antecipação pública', () => {
  const repository = {
    criar: jest.fn(),
    possuiAgendamentoDoProcedimentoNoDia: jest.fn(),
    buscarAgendamentoDoProcedimentoNoDia: jest.fn(),
  };
  const avaliarHorario = jest.fn();
  const cliente = { buscarPorId: jest.fn() };
  const recebimentoPixService = {
    verificarPagamentoOnlineDisponivel: jest.fn(),
  };
  const service = new AgendamentoService(
    repository as never,
    { avaliarHorario } as never,
    { validarCriacao: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    cliente as never,
    {} as never,
    recebimentoPixService as never,
  );
  const input = {
    salaoId: 'salao-a',
    exigirSemSinal: true,
    dados: {
      cliente_id: 'cliente-a',
      procedimento_id: 'procedimento-a',
      data: '2030-01-01',
      hora_inicio: '10:00',
      confirmar_excecoes: false,
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
    avaliarHorario.mockReturnValue({ profissionalId: 'profissional-a' });
    repository.criar.mockResolvedValue({
      id: 'agendamento-a',
      estado: 'agendado',
    });
    recebimentoPixService.verificarPagamentoOnlineDisponivel.mockResolvedValue(true);
  });
  function configurarSinal(valor: string, politica: 'obrigatorio' | 'opcional' = 'obrigatorio') {
    jest.spyOn(service, 'buscarDadosParaAvaliacaoHorario').mockResolvedValue({
      fusoHorario: 'America/Sao_Paulo',
      configuracao: {},
      profissionais: [],
      ocupacoes: [],
      procedimento: {
        preco: '100.00',
        tipo_sinal: 'fixo',
        valor_sinal: valor,
        politica_sinal: politica,
        duracao_min: 30,
      },
    } as never);
  }
  it('impede confirmar sem pagamento quando o sinal é positivo, online disponível e política obrigatória', async () => {
    configurarSinal('25.00', 'obrigatorio');
    await expect(service.criar(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.criar).not.toHaveBeenCalled();
  });
  it('permite agendar com sinal quando pagamento online estiver indisponível no salão', async () => {
    recebimentoPixService.verificarPagamentoOnlineDisponivel.mockResolvedValue(false);
    configurarSinal('25.00', 'obrigatorio');
    await expect(service.criar(input)).resolves.toMatchObject({
      estado: 'agendado',
    });
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        salaoId: 'salao-a',
        valorSinal: '25.00',
        pagamentoNoSalao: true,
      }),
    );
  });
  it('permite agendar com sinal quando política for opcional e cliente escolheu pagar no salão', async () => {
    recebimentoPixService.verificarPagamentoOnlineDisponivel.mockResolvedValue(true);
    configurarSinal('25.00', 'opcional');
    await expect(
      service.criar({ ...input, pagamentoNoSalao: true }),
    ).resolves.toMatchObject({
      estado: 'agendado',
    });
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        salaoId: 'salao-a',
        valorSinal: '25.00',
        pagamentoNoSalao: true,
      }),
    );
  });
  it('impede agendar quando política for opcional mas cliente não escolheu pagar no salão', async () => {
    recebimentoPixService.verificarPagamentoOnlineDisponivel.mockResolvedValue(true);
    configurarSinal('25.00', 'opcional');
    await expect(service.criar(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.criar).not.toHaveBeenCalled();
  });
  it('confirma sinal zero sem criar cobrança nem reserva paga', async () => {
    configurarSinal('0.00');
    await expect(service.criar(input)).resolves.toMatchObject({
      estado: 'agendado',
    });
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ salaoId: 'salao-a', valorSinal: '0.00' }),
    );
  });

  it('informa que a cliente já tem reserva aguardando pagamento quando procedimento duplicado for reservado', async () => {
    configurarSinal('0.00');
    repository.buscarAgendamentoDoProcedimentoNoDia.mockResolvedValue({
      id: 'reserva-pendente',
      estado: 'reservado',
    });

    await expect(
      service.criar({ ...input, bloquearProcedimentoDuplicadoNoDia: true }),
    ).rejects.toThrow(
      new ConflictException('Você já tem uma reserva aguardando pagamento neste dia.'),
    );
  });

  it('informa que a cliente já tem procedimento agendado quando procedimento duplicado for agendado', async () => {
    configurarSinal('0.00');
    repository.buscarAgendamentoDoProcedimentoNoDia.mockResolvedValue({
      id: 'agendamento-existente',
      estado: 'agendado',
    });

    await expect(
      service.criar({ ...input, bloquearProcedimentoDuplicadoNoDia: true }),
    ).rejects.toThrow(
      new ConflictException('Você já possui este procedimento agendado neste dia.'),
    );
  });
});
