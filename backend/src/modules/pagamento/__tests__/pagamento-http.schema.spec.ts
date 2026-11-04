import {
  atualizarRecebimentoPixSchema,
  iniciarPagamentoPixSchema,
  instituicoesPixResponseSchema,
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
  it('valida pagador e rejeita dados extras de salão ou valor no checkout', () => {
    const data = {
      credencial: 'd2e01b24-224b-4d4b-9fc7-a7da9733aa88',
      modalidade: 'sinal',
      pagador: {
        cpf: '51687574219',
        instituicao_id: '9f4cd202-8f2b-11ec-b909-0242ac120002',
      },
    };
    expect(iniciarPagamentoPixSchema.safeParse(data).success).toBe(true);
    expect(
      iniciarPagamentoPixSchema.safeParse({ ...data, salao_id: 'other' })
        .success,
    ).toBe(false);
    expect(
      iniciarPagamentoPixSchema.safeParse({ ...data, valor: 1 }).success,
    ).toBe(false);
    expect(
      iniciarPagamentoPixSchema.safeParse({
        ...data,
        pagador: { ...data.pagador, cpf: 'invalid' },
      }).success,
    ).toBe(false);
  });
  it('aceita identificadores opacos de instituição e recusa vazios ou excessivos', () => {
    const checkout = (id: string) =>
      iniciarPagamentoPixSchema.safeParse({
        credencial: 'd2e01b24-224b-4d4b-9fc7-a7da9733aa88',
        modalidade: 'sinal',
        pagador: { cpf: '51687574219', instituicao_id: id },
      }).success;
    expect(checkout('bank:123')).toBe(true);
    expect(checkout(' ')).toBe(false);
    expect(checkout('x'.repeat(201))).toBe(false);
    expect(
      instituicoesPixResponseSchema.safeParse([
        { id: 'bank:123', nome: 'Banco' },
      ]).success,
    ).toBe(true);
  });
});
