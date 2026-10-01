import type { SalaoPublicoResponseDto } from '@fluy/schema';
import type { SalaoConsultado } from '@/modules/salao/contracts';
import type { SalaoConfiguracaoPersistida } from '@/modules/salao-configuracao/contracts';

export function toSalaoPublicoResponse(
  salao: SalaoConsultado,
  configuracao: SalaoConfiguracaoPersistida,
): SalaoPublicoResponseDto {
  return {
    nome: salao.nome,
    subdominio: salao.subdominio,
    contato_whatsapp: salao.contato_whatsapp,
    endereco: salao.endereco,
    mensagem_confirmacao: configuracao.mensagem_confirmacao,
    politica_atraso: configuracao.politica_atraso,
    tolerancia_atraso_min: configuracao.tolerancia_atraso_min,
  };
}
