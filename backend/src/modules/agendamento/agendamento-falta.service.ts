import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AgendamentoDetalheResultado,
  MarcarFaltaAgendamentoInput,
} from '@/modules/agendamento/contracts';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

@Injectable()
export class AgendamentoFaltaService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
  ) {}

  async marcarFalta({
    id,
    salaoId,
  }: MarcarFaltaAgendamentoInput): Promise<AgendamentoDetalheResultado> {
    const agendamento = await this.agendamentoRepository.buscarDetalhe({
      id,
      salaoId,
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const agora = new Date();

    this.agendamentoValidator.validarFalta({
      estado: agendamento.estado,
      inicioEm: agendamento.inicio_em,
      agora,
    });

    const marcado = await this.agendamentoRepository.marcarFalta({
      id,
      salaoId,
      // O faturamento usa a data da marcação, não a de `inicio_em`.
      ocorreuEm: agora,
    });

    if (!marcado) {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    return this.agendamentoService.buscarDetalhe({ id, salaoId });
  }
}
