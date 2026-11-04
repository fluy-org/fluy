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
  };
  const avaliarHorario = jest.fn();
  const cliente = { buscarPorId: jest.fn() };
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
  });
  function configurarSinal(valor: string) {
    jest.spyOn(service, 'buscarDadosParaAvaliacaoHorario').mockResolvedValue({
      fusoHorario: 'America/Sao_Paulo',
      configuracao: {},
      profissionais: [],
      ocupacoes: [],
      procedimento: {
        preco: '100.00',
        tipo_sinal: 'fixo',
        valor_sinal: valor,
        duracao_min: 30,
      },
    } as never);
  }
  it('impede confirmar sem pagamento quando o sinal é positivo', async () => {
    configurarSinal('25.00');
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
});
