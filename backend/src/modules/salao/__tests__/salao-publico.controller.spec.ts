import { SalaoPublicoController } from '@/modules/salao/salao-publico.controller';

describe('SalaoPublicoController', () => {
  it('retorna os dados públicos do salão incluindo pagamento_online_disponivel e prazo_reserva_min', async () => {
    const salaoConsultaService = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 'salao-a',
        nome: 'Salão Teste',
        subdominio: 'salao-teste',
        contato_whatsapp: '+5511999999999',
        endereco: 'Rua A',
        fuso_horario: 'America/Sao_Paulo',
      }),
    };
    const salaoConfiguracaoService = {
      buscar: jest.fn().mockResolvedValue({
        mensagem_confirmacao: 'Bem-vinda',
        politica_atraso: '10 min',
        tolerancia_atraso_min: 10,
        prazo_reserva_min: 15,
      }),
    };
    const recebimentoPixService = {
      verificarPagamentoOnlineDisponivel: jest.fn().mockResolvedValue(true),
    };

    const controller = new SalaoPublicoController(
      salaoConsultaService as never,
      salaoConfiguracaoService as never,
      recebimentoPixService as never,
    );

    const resposta = await controller.buscar({ salaoId: 'salao-a' } as never);

    expect(resposta).toMatchObject({
      nome: 'Salão Teste',
      pagamento_online_disponivel: true,
      prazo_reserva_min: 15,
    });
    expect(recebimentoPixService.verificarPagamentoOnlineDisponivel).toHaveBeenCalledWith('salao-a');
  });
});
