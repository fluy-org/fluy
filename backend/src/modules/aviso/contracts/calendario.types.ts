import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';
import type { SalaoConsultado } from '@/modules/salao/contracts';

export type MetodoCalendario = 'REQUEST' | 'CANCEL';

export type GerarCalendarioIcsInput = {
  agendamento: AgendamentoDetalheResultado;
  salao: SalaoConsultado;
  agora?: Date;
};

export type CalendarioIcsResultado = {
  conteudo: string;
  metodo: MetodoCalendario;
  nomeArquivo: string;
};
