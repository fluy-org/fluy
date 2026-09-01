import type {
  ProcedimentoPublicoResponseDto,
  ProcedimentoResponseDto,
} from '@fluy/schema';
import type { ProcedimentoPersistido } from '@/modules/procedimento/contracts';

export function toProcedimentoResponse(
  procedimento: ProcedimentoPersistido,
): ProcedimentoResponseDto {
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
    ativo: procedimento.ativo,
    criado_em: procedimento.criado_em.toISOString(),
  };
}

export function toProcedimentoPublicoResponse(
  procedimento: ProcedimentoPersistido,
): ProcedimentoPublicoResponseDto {
  return {
    id: procedimento.id,
    nome: procedimento.nome,
    descricao: procedimento.descricao,
    duracao_min: procedimento.duracao_min,
    preco: Number(procedimento.preco),
  };
}
