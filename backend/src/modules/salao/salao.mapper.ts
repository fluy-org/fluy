import type {
  SalaoPublicoResponseDto,
  SalaoResponseDto,
  SalaoSetupResponseDto,
} from '@fluy/schema';
import type {
  SalaoConsultado,
  SalaoSetupConsultado,
} from '@/modules/salao/contracts';
import type { SalaoConfiguracaoPersistida } from '@/modules/salao-configuracao/contracts';

export function toSalaoAtualResponse(
  salao: SalaoConsultado,
): SalaoResponseDto {
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

export function toSalaoSetupResponse(
  setup: SalaoSetupConsultado,
): SalaoSetupResponseDto {
  return {
    tem_procedimento_ativo: setup.temProcedimentoAtivo,
    tem_disponibilidade: setup.temDisponibilidade,
    tem_pix: setup.temPix,
    subdominio: setup.subdominio,
  };
}

export function toSalaoPublicoResponse({
  salao,
  configuracao,
  pagamentoOnlineDisponivel,
}: {
  salao: SalaoConsultado;
  configuracao: SalaoConfiguracaoPersistida;
  pagamentoOnlineDisponivel: boolean;
}): SalaoPublicoResponseDto {
  return {
    nome: salao.nome,
    subdominio: salao.subdominio,
    contato_whatsapp: salao.contato_whatsapp,
    endereco: salao.endereco,
    fuso_horario: salao.fuso_horario,
    mensagem_confirmacao: configuracao.mensagem_confirmacao,
    politica_atraso: configuracao.politica_atraso,
    tolerancia_atraso_min: configuracao.tolerancia_atraso_min,
    pagamento_online_disponivel: pagamentoOnlineDisponivel,
    prazo_reserva_min: configuracao.prazo_reserva_min,
  };
}
