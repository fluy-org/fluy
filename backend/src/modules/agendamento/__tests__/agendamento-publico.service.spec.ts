jest.mock('@/modules/agendamento/agendamento.service', () => ({
  AgendamentoService: class AgendamentoService {},
}));

jest.mock('@/modules/cliente/cliente.service', () => ({
  ClienteService: class ClienteService {},
}));

import { NotFoundException } from '@nestjs/common';
import { AgendamentoPublicoService } from '@/modules/agendamento/agendamento-publico.service';
import type { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import type { ClienteService } from '@/modules/cliente/cliente.service';

describe('AgendamentoPublicoService', () => {
  const listarHorariosLivres = jest.fn();
  const criar = jest.fn();
  const resolverSessaoPublica = jest.fn();
  const service = new AgendamentoPublicoService(
    { listarHorariosLivres, criar } as unknown as AgendamentoService,
    { resolverSessaoPublica } as unknown as ClienteService,
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
      dados: {
        cliente_id: 'cliente-da-sessao',
        procedimento_id: dados.procedimento_id,
        data: dados.data,
        hora_inicio: '10:00',
        confirmar_excecoes: false,
      },
    });
  });
});
