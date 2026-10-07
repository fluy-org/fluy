jest.mock('@/modules/agendamento/agendamento.service', () => ({
  AgendamentoService: class AgendamentoService {},
}));

jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class ClienteService {},
}));

jest.mock('@/modules/agendamento/agendamento-cancelamento.service', () => ({
  AgendamentoCancelamentoService: class AgendamentoCancelamentoService {},
}));

jest.mock('@/modules/aviso/calendario-ics.service', () => ({
  CalendarioIcsService: class CalendarioIcsService {},
}));

jest.mock('@/modules/aviso/agendamento-aviso.service', () => ({
  AgendamentoAvisoService: class AgendamentoAvisoService {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AgendamentoCancelamentoService } from '@/modules/agendamento/agendamento-cancelamento.service';
import { AgendamentoPublicoService } from '@/modules/agendamento/agendamento-publico.service';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import type { ClienteService } from '@/modules/cliente/cliente.service';
import type { CalendarioIcsService } from '@/modules/aviso/calendario-ics.service';
import type { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';

describe('AgendamentoPublicoService', () => {
  const listarHorariosLivres = jest.fn();
  const criar = jest.fn();
  const buscarDetalhe = jest.fn();
  const cancelar = jest.fn();
  const listarAgendamentos = jest.fn();
  const resolverSessaoPublica = jest.fn();
  const gerarCalendario = jest.fn();
  const notificarCriacaoPublica = jest.fn();
  const notificarCancelamentoPelaCliente = jest.fn();
  const service = new AgendamentoPublicoService(
    {
      listarHorariosLivres,
      criar,
      buscarDetalhe,
    } as unknown as AgendamentoService,
    { cancelar } as unknown as AgendamentoCancelamentoService,
    {
      resolverSessaoPublica,
      listarAgendamentos,
    } as unknown as ClienteService,
    { gerar: gerarCalendario } as unknown as CalendarioIcsService,
    {
      notificarCriacaoPublica,
      notificarCancelamentoPelaCliente,
    } as unknown as AgendamentoAvisoService,
  );
  const dados = {
    credencial: 'ca76ae02-2e2f-4d50-b7c6-d0d2a45523b3',
    procedimento_id: '2fba8eaa-39c5-4b74-856a-46c9a526c9ee',
    data: '2026-09-29',
  };

  beforeEach(() => jest.clearAllMocks());

  it('valida a sessão no salão do path antes de consultar o motor', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-1' });
    listarHorariosLivres.mockResolvedValue({ data: dados.data, horarios: [] });

    await service.listarHorariosLivres({ salaoId: 'salao-do-path', dados });

    expect(resolverSessaoPublica).toHaveBeenCalledWith({
      salaoId: 'salao-do-path',
      credencial: dados.credencial,
    });
    expect(listarHorariosLivres).toHaveBeenCalledWith({
      salaoId: 'salao-do-path',
      dados: {
        procedimento_id: dados.procedimento_id,
        data: dados.data,
      },
    });
  });

  it('rejeita credencial que não pertence ao salão do path', async () => {
    resolverSessaoPublica.mockResolvedValue(undefined);

    await expect(
      service.listarHorariosLivres({ salaoId: 'outro-salao', dados }),
    ).rejects.toThrow(
      new NotFoundException('Sessão da cliente não encontrada.'),
    );
    expect(listarHorariosLivres).not.toHaveBeenCalled();
  });
  it('cria usando a cliente da sessao e revalida pelo motor', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    criar.mockResolvedValue({ id: 'agendamento-1' });
    buscarDetalhe.mockResolvedValue({
      id: 'agendamento-1',
      cliente: { id: 'cliente-da-sessao' },
    });

    await service.criar({
      salaoId: 'salao-do-path',
      dados: {
        ...dados,
        hora_inicio: '10:00',
        confirmar_excecoes: false,
      },
    });

    expect(criar).toHaveBeenCalledWith({
      salaoId: 'salao-do-path',
      bloquearProcedimentoDuplicadoNoDia: true,
      notificarCliente: false,
      dados: {
        cliente_id: 'cliente-da-sessao',
        procedimento_id: dados.procedimento_id,
        data: dados.data,
        hora_inicio: '10:00',
        confirmar_excecoes: false,
      },
    });
    expect(notificarCriacaoPublica).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'agendamento-1' }),
    );
  });

  it('lista somente os agendamentos da cliente resolvida pela sessao', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    listarAgendamentos.mockResolvedValue({ itens: [] });

    await service.listar({
      salaoId: 'salao-do-path',
      dados: { credencial: dados.credencial, cursor: 'cursor-2' },
    });

    expect(listarAgendamentos).toHaveBeenCalledWith({
      id: 'cliente-da-sessao',
      salaoId: 'salao-do-path',
      cursor: 'cursor-2',
    });
  });

  it('nao revela o agendamento de outra cliente', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    buscarDetalhe.mockResolvedValue({
      cliente: { id: 'outra-cliente' },
    });

    await expect(
      service.buscarDetalhe({
        id: 'agendamento-1',
        salaoId: 'salao-do-path',
        dados: { credencial: dados.credencial },
      }),
    ).rejects.toThrow(new NotFoundException('Agendamento não encontrado.'));
  });

  it('cancela o proprio agendamento confirmado pelo servico compartilhado', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    buscarDetalhe.mockResolvedValue({
      estado: 'agendado',
      cliente: { id: 'cliente-da-sessao' },
    });
    cancelar.mockResolvedValue({
      id: 'agendamento-1',
      estado: 'cancelado',
    });

    await service.cancelar({
      id: 'agendamento-1',
      salaoId: 'salao-do-path',
      dados: { credencial: dados.credencial },
    });

    expect(cancelar).toHaveBeenCalledWith({
      id: 'agendamento-1',
      salaoId: 'salao-do-path',
      dados: { motivo: 'Cancelado pela cliente.' },
      canceladoPor: 'cliente',
      notificarCliente: false,
    });
    expect(notificarCancelamentoPelaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'agendamento-1' }),
    );
  });

  it('gera calendário apenas para agendamento da cliente da sessão', async () => {
    const agendamento = {
      id: 'agendamento-1',
      cliente: { id: 'cliente-da-sessao' },
    };
    const calendario = { conteudo: 'BEGIN:VCALENDAR', metodo: 'REQUEST' };
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    buscarDetalhe.mockResolvedValue(agendamento);
    gerarCalendario.mockResolvedValue(calendario);

    await expect(
      service.gerarCalendario({
        id: agendamento.id,
        salaoId: 'salao-do-path',
        dados: { credencial: dados.credencial },
      }),
    ).resolves.toBe(calendario);
    expect(gerarCalendario).toHaveBeenCalledWith(agendamento);
  });

  it('rejeita o cancelamento de agendamento encerrado', async () => {
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-da-sessao' });
    buscarDetalhe.mockResolvedValue({
      estado: 'cancelado',
      cliente: { id: 'cliente-da-sessao' },
    });

    await expect(
      service.cancelar({
        id: 'agendamento-1',
        salaoId: 'salao-do-path',
        dados: { credencial: dados.credencial },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(cancelar).not.toHaveBeenCalled();
  });
});
