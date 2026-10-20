import type { RecebimentoPixResponseDto } from '@fluy/schema';
import type { SalaoConfiguracaoPersistida } from '@/modules/salao-configuracao/contracts';

export function toRecebimentoPixResponse(
  configuracao: SalaoConfiguracaoPersistida,
): RecebimentoPixResponseDto {
  return {
    tipo_chave:
      configuracao.pix_tipo_chave as RecebimentoPixResponseDto['tipo_chave'],
    chave: configuracao.pix_chave!,
    nome_recebedor: configuracao.pix_nome_recebedor!,
    atualizado_em: configuracao.pix_atualizado_em!.toISOString(),
  };
}
