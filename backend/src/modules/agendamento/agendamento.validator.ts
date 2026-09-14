import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { ValidarCriacaoAgendamentoInput } from '@/modules/agendamento/contracts';

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
}
