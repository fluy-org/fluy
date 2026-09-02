import type { ProcedimentoPersistido } from '@/modules/procedimento/contracts';
import {
  toProcedimentoPublicoResponse,
  toProcedimentoResponse,
} from '@/modules/procedimento/procedimento.mapper';

describe('ProcedimentoMapper', () => {
  const apiPublicUrl = 'https://api.fluy.test';

  it('returns null image URLs when the procedure has no image', () => {
    const procedimento = criarProcedimentoPersistido();

    expect(
      toProcedimentoResponse({ procedimento, apiPublicUrl }).imagem_url,
    ).toBe(null);
    expect(
      toProcedimentoPublicoResponse({ procedimento, apiPublicUrl }).imagem_url,
    ).toBe(null);
  });

  it('returns the direct public image URL when the procedure has an image', () => {
    const procedimento = criarProcedimentoPersistido({
      imagem: {
        arquivo_id: '17ec75fb-8f19-457c-9913-c22d1ffecbdc',
        procedimento_id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
      },
    });
    const imagemUrl =
      'https://api.fluy.test/publico/saloes/0f2dbab7-9b47-4e99-95c9-04558d73eb57/procedimentos/c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43/imagem';

    expect(
      toProcedimentoResponse({ procedimento, apiPublicUrl }).imagem_url,
    ).toBe(imagemUrl);
    expect(
      toProcedimentoPublicoResponse({ procedimento, apiPublicUrl }).imagem_url,
    ).toBe(imagemUrl);
  });

  it('does not duplicate the path separator when the public API URL ends with one', () => {
    const procedimento = criarProcedimentoPersistido({
      imagem: {
        arquivo_id: '17ec75fb-8f19-457c-9913-c22d1ffecbdc',
        procedimento_id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
      },
    });

    expect(
      toProcedimentoResponse({
        procedimento,
        apiPublicUrl: `${apiPublicUrl}/`,
      }).imagem_url,
    ).toBe(
      'https://api.fluy.test/publico/saloes/0f2dbab7-9b47-4e99-95c9-04558d73eb57/procedimentos/c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43/imagem',
    );
  });
});

function criarProcedimentoPersistido(
  input: Partial<ProcedimentoPersistido> = {},
): ProcedimentoPersistido {
  return {
    id: 'c7d30e66-cf2a-4cdf-a6de-7a9a083e9a43',
    salao_id: '0f2dbab7-9b47-4e99-95c9-04558d73eb57',
    nome: 'Corte',
    descricao: null,
    info_pre_procedimento: null,
    duracao_min: 30,
    preco: '100.00',
    tipo_sinal: 'fixo',
    valor_sinal: '20.00',
    periodo_manutencao_dias: null,
    ativo: true,
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
    ...input,
    imagem: input.imagem ?? null,
  };
}
