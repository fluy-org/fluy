import { Injectable } from '@nestjs/common';
import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';
import { gerarCalendarioIcs } from '@/modules/aviso/calendario-ics.utils';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

@Injectable()
export class CalendarioIcsService {
  constructor(private readonly salaoConsultaService: SalaoConsultaService) {}

  async gerar(agendamento: AgendamentoDetalheResultado) {
    const salao = await this.salaoConsultaService.buscarPorId(
      agendamento.salao_id,
    );

    return gerarCalendarioIcs({ agendamento, salao });
  }
}
