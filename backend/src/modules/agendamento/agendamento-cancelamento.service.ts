import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AgendamentoDetalheResultado,
  CancelarAgendamentoInput,
} from '@/modules/agendamento/contracts';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

@Injectable()
export class AgendamentoCancelamentoService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
  ) {}

  async cancelar({
    id,
    salaoId,
    dados,
  }: CancelarAgendamentoInput): Promise<AgendamentoDetalheResultado> {
    const agendamento = await this.agendamentoRepository.buscarDetalhe({
      id,
      salaoId,
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    this.agendamentoValidator.validarCancelamento({
      estado: agendamento.estado,
    });

    const cancelado = await this.agendamentoRepository.cancelar({
      id,
      salaoId,
      // O faturamento usa a data do cancelamento, não a de `inicio_em`.
      ocorreuEm: new Date(),
      motivo: dados.motivo,
    });

    if (!cancelado) {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    return this.agendamentoService.buscarDetalhe({ id, salaoId });
  }
}
