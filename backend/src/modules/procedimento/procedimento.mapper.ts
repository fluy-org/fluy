import type {
  ProcedimentoPublicoResponseDto,
  ProcedimentoResponseDto,
} from '@fluy/schema';
import type { ProcedimentoPersistido } from '@/modules/procedimento/contracts';

export function toProcedimentoResponse({
  procedimento,
  apiPublicUrl,
}: {
  procedimento: ProcedimentoPersistido;
  apiPublicUrl: string;
}): ProcedimentoResponseDto {
  return {
    id: procedimento.id,
    nome: procedimento.nome,
    descricao: procedimento.descricao,
    info_pre_procedimento: procedimento.info_pre_procedimento,
    duracao_min: procedimento.duracao_min,
    preco: Number(procedimento.preco),
    tipo_sinal: procedimento.tipo_sinal,
    valor_sinal: Number(procedimento.valor_sinal),
    periodo_manutencao_dias: procedimento.periodo_manutencao_dias,
    imagem_url: criarUrlImagemProcedimento({ procedimento, apiPublicUrl }),
    ativo: procedimento.ativo,
    criado_em: procedimento.criado_em.toISOString(),
  };
}

export function toProcedimentoPublicoResponse({
  procedimento,
  apiPublicUrl,
}: {
  procedimento: ProcedimentoPersistido;
  apiPublicUrl: string;
}): ProcedimentoPublicoResponseDto {
  return {
    id: procedimento.id,
    nome: procedimento.nome,
    descricao: procedimento.descricao,
    duracao_min: procedimento.duracao_min,
    preco: Number(procedimento.preco),
    imagem_url: criarUrlImagemProcedimento({ procedimento, apiPublicUrl }),
  };
}

function criarUrlImagemProcedimento({
  procedimento,
  apiPublicUrl,
}: {
  procedimento: ProcedimentoPersistido;
  apiPublicUrl: string;
}): string | null {
  if (!procedimento.imagem) {
    return null;
  }

  const baseUrl = apiPublicUrl.endsWith('/')
    ? apiPublicUrl
    : `${apiPublicUrl}/`;

  return new URL(
    `publico/saloes/${procedimento.salao_id}/procedimentos/${procedimento.id}/imagem`,
    baseUrl,
  ).toString();
}
