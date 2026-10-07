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
import { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';

@Injectable()
export class AgendamentoCancelamentoService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
    private readonly agendamentoAvisoService: AgendamentoAvisoService,
  ) {}

  async cancelar({
    id,
    salaoId,
    dados,
    canceladoPor,
    notificarCliente = true,
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
      canceladoPor,
    });

    if (!cancelado) {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    const detalhe = await this.agendamentoService.buscarDetalhe({
      id,
      salaoId,
    });

    if (notificarCliente) {
      await this.agendamentoAvisoService.notificarCancelamento(detalhe);
    }

    return detalhe;
  }
}
