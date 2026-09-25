import type { SalaoPublicoResponseDto } from '@fluy/schema';
import type { SalaoConsultado } from '@/modules/salao/contracts';

export function toSalaoPublicoResponse(
  salao: SalaoConsultado,
): SalaoPublicoResponseDto {
  return {
    nome: salao.nome,
    subdominio: salao.subdominio,
    contato_whatsapp: salao.contato_whatsapp,
    endereco: salao.endereco,
  };
}
