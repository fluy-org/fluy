import type { SalaoResponseDto } from '@fluy/schema';
import type { SalaoPersistido } from './contracts';

export function toSalaoResponse(salao: SalaoPersistido): SalaoResponseDto {
  return {
    id: salao.id,
    nome: salao.nome,
    subdominio: salao.subdominio,
    contato_whatsapp: salao.contato_whatsapp,
    endereco: salao.endereco,
    fuso_horario: salao.fuso_horario,
    criado_em: salao.criado_em.toISOString(),
  };
}
