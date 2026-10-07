jest.mock('@/modules/aviso/aviso.service', () => ({
  AvisoService: class AvisoService {},
}));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_MINUTE: '* * * * *' },
}));

import type { AvisoService } from '@/modules/aviso/aviso.service';
import { LembreteNotificacaoService } from '@/modules/lembrete/lembrete-notificacao.service';
import type { LembreteRepository } from '@/modules/lembrete/lembrete.repository';

describe('LembreteNotificacaoService', () => {
  const listarVencidosParaNotificacao = jest.fn();
  const marcarNotificado = jest.fn();
  const criarParaSalao = jest.fn();
  const service = new LembreteNotificacaoService(
    {
      listarVencidosParaNotificacao,
      marcarNotificado,
    } as unknown as LembreteRepository,
    { criarParaSalao } as unknown as AvisoService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('cria o aviso e marca o lembrete para não repetir', async () => {
    listarVencidosParaNotificacao.mockResolvedValue([
      {
        id: 'lembrete-1',
        salaoId: 'salao-1',
        texto: 'Ligar para confirmar o retorno.',
        cliente: { id: 'cliente-1', nome: 'Ana' },
      },
    ]);
    criarParaSalao.mockResolvedValue([{ id: 'aviso-1' }]);

    await service.processarVencidosDoSalao('salao-1');

    expect(listarVencidosParaNotificacao).toHaveBeenCalledWith({
      salaoId: 'salao-1',
      limite: 100,
    });
    expect(criarParaSalao).toHaveBeenCalledWith({
      salaoId: 'salao-1',
      lembreteId: 'lembrete-1',
      tipo: 'lembrete_vencido',
      titulo: 'Lembrete de Ana',
      mensagem: 'Ligar para confirmar o retorno.',
    });
    expect(marcarNotificado).toHaveBeenCalledWith({
      id: 'lembrete-1',
      salaoId: 'salao-1',
      notificadoEm: expect.any(Date),
    });
  });

  it('não marca o lembrete quando o aviso falha', async () => {
    listarVencidosParaNotificacao.mockResolvedValue([
      {
        id: 'lembrete-1',
        salaoId: 'salao-1',
        texto: 'Ligar para confirmar o retorno.',
        cliente: { id: 'cliente-1', nome: 'Ana' },
      },
    ]);
    criarParaSalao.mockRejectedValue(new Error('Falha no banco.'));

    await expect(service.processar()).rejects.toThrow('Falha no banco.');
    expect(marcarNotificado).not.toHaveBeenCalled();
  });
});
