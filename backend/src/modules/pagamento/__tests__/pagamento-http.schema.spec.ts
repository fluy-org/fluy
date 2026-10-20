import {
  atualizarRecebimentoPixSchema,
  iniciarPagamentoPixSchema,
} from '@fluy/schema';

describe('contratos HTTP de pagamento', () => {
  it('aceita cadastro Pix mínimo e rejeita campos extras', () => {
    const dados = {
      tipo_chave: 'email',
      chave: 'salao@example.com',
      nome_recebedor: 'Salão A',
    };

    expect(atualizarRecebimentoPixSchema.safeParse(dados).success).toBe(true);
    expect(
      atualizarRecebimentoPixSchema.safeParse({ ...dados, salao_id: 'outro' })
        .success,
    ).toBe(false);
  });

  it('aceita apenas sinal ou total para uma solicitação', () => {
    expect(
      iniciarPagamentoPixSchema.safeParse({
        credencial: 'd2e01b24-224b-4d4b-9fc7-a7da9733aa88',
        modalidade: 'sinal',
      }).success,
    ).toBe(true);
    expect(
      iniciarPagamentoPixSchema.safeParse({
        credencial: 'd2e01b24-224b-4d4b-9fc7-a7da9733aa88',
        modalidade: 'cartao',
      }).success,
    ).toBe(false);
  });
});
