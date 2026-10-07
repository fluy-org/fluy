import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';
import { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';
import type { AvisoService } from '@/modules/aviso/aviso.service';

describe('AgendamentoAvisoService', () => {
  const criarParaCliente = jest.fn();
  const criarParaSalao = jest.fn();
  const service = new AgendamentoAvisoService({
    criarParaCliente,
    criarParaSalao,
  } as unknown as AvisoService);
  const agendamento = {
    id: 'agendamento-1',
    salao_id: 'salao-1',
    inicio_em: new Date('2026-10-10T13:00:00.000Z'),
    fusoHorario: 'America/Sao_Paulo',
    cliente: { id: 'cliente-1', nome: 'Ana' },
    procedimento: { id: 'procedimento-1', nome: 'Corte' },
  } as AgendamentoDetalheResultado;

  beforeEach(() => jest.clearAllMocks());

  it('cria aviso para o agendamento manual', async () => {
    await service.notificarCriacaoManual(agendamento);

    expect(criarParaCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        salaoId: 'salao-1',
        clienteId: 'cliente-1',
        agendamentoId: 'agendamento-1',
        tipo: 'agendamento_criado',
      }),
    );
  });

  it('avisa o salão sobre o agendamento criado pela cliente', async () => {
    await service.notificarCriacaoPublica(agendamento);

    expect(criarParaSalao).toHaveBeenCalledWith(
      expect.objectContaining({
        salaoId: 'salao-1',
        agendamentoId: 'agendamento-1',
        tipo: 'novo_agendamento_salao',
      }),
    );
  });

  it('descreve os horários anterior e atual na remarcação', async () => {
    await service.notificarRemarcacao({
      anterior: {
        ...agendamento,
        inicio_em: new Date('2026-10-10T13:00:00.000Z'),
      },
      atual: {
        ...agendamento,
        inicio_em: new Date('2026-10-11T16:00:00.000Z'),
      },
    });

    expect(criarParaCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'agendamento_remarcado',
        mensagem: expect.stringContaining('10/10/2026, 10:00'),
      }),
    );
    expect(criarParaCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: expect.stringContaining('11/10/2026, 13:00'),
      }),
    );
  });

  it('cria aviso de cancelamento pelo salão', async () => {
    await service.notificarCancelamento(agendamento);

    expect(criarParaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'agendamento_cancelado' }),
    );
  });

  it('avisa o salão sobre o cancelamento feito pela cliente', async () => {
    await service.notificarCancelamentoPelaCliente(agendamento);

    expect(criarParaSalao).toHaveBeenCalledWith(
      expect.objectContaining({
        salaoId: 'salao-1',
        agendamentoId: 'agendamento-1',
        tipo: 'cancelamento_cliente_salao',
      }),
    );
  });
});
