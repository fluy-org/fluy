import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { emCentavos } from '@/modules/agendamento/agendamento-utils';
import type {
  ValidarConclusaoAgendamentoInput,
  ValidarCriacaoAgendamentoInput,
} from '@/modules/agendamento/contracts';

@Injectable()
export class AgendamentoValidator {
  validarCriacao({
    avaliacao,
    confirmarExcecoes,
  }: ValidarCriacaoAgendamentoInput): void {
    if (avaliacao.status === 'indisponivel') {
      if (avaliacao.bloqueios.includes('sem_profissional_disponivel')) {
        throw new ConflictException(
          'Nenhuma profissional está disponível neste horário.',
        );
      }

      throw new BadRequestException(
        'O horário informado não pode ser agendado.',
      );
    }

    if (avaliacao.status === 'requer_confirmacao' && !confirmarExcecoes) {
      throw new BadRequestException(
        'Confirme as exceções do horário antes de criar o agendamento.',
      );
    }
  }

  validarConclusao({
    estado,
    valorPendente,
    metodoPagamento,
  }: ValidarConclusaoAgendamentoInput): void {
    if (estado === 'reservado') {
      throw new BadRequestException(
        'Só é possível concluir um agendamento confirmado.',
      );
    }

    if (estado !== 'agendado') {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    if (
      metodoPagamento !== null &&
      emCentavos({ valor: valorPendente }) === 0n
    ) {
      throw new BadRequestException('Não há valor pendente para registrar.');
    }
  }
}
