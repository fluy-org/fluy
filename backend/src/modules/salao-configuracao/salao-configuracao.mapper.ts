import type { ConfiguracaoSalaoResponseDto } from '@fluy/schema';
import type { SalaoConfiguracaoPersistida } from '@/modules/salao-configuracao/contracts';

export function toSalaoConfiguracaoResponse(
  configuracao: SalaoConfiguracaoPersistida,
): ConfiguracaoSalaoResponseDto {
  return {
    granularidade_min: configuracao.granularidade_min,
    prazo_reserva_min: configuracao.prazo_reserva_min,
    tolerancia_atraso_min: configuracao.tolerancia_atraso_min,
    antecedencia_min_horas: configuracao.antecedencia_min_horas,
    antecedencia_max_dias: configuracao.antecedencia_max_dias,
    mensagem_confirmacao: configuracao.mensagem_confirmacao,
    politica_atraso: configuracao.politica_atraso,
  };
}
