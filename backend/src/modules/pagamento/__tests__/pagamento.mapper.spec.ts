import {
  toPagamentoPixResponse,
  toReservaPixResponse,
} from '@/modules/pagamento/pagamento.mapper';

describe('mapeamento HTTP de pagamento', () => {
  it('converte valores e datas e usa a divergência persistida', () => {
    const resposta = toPagamentoPixResponse({
      id: 'cobranca-a',
      status: 'confirmada',
      modalidade: 'sinal',
      valor: '25.00',
      taxa_cliente: '1.00',
      total_cliente: '26.00',
      expira_em: new Date('2030-01-01T00:15:00.000Z'),
      divergencia: true,
      instrucao_cliente: null,
    } as never);
    expect(resposta).toMatchObject({
      valor_salao: 25,
      taxa_cliente: 1,
      total_cliente: 26,
      situacao: 'confirmado_apos_expiracao',
      expira_em: '2030-01-01T00:15:00.000Z',
    });
  });

  it('inclui o prazo da reserva no retorno', () => {
    const resposta = toReservaPixResponse({
      id: 'reserva-a',
      inicio_em: new Date('2030-01-01T00:00:00.000Z'),
      criado_em: new Date('2029-12-31T23:00:00.000Z'),
      expira_em: new Date('2030-01-01T00:15:00.000Z'),
    } as never);
    expect(resposta.expira_em).toBe('2030-01-01T00:15:00.000Z');
  });
});
