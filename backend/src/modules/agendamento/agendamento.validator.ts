import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { emCentavos } from '@/modules/agendamento/agendamento-utils';
import type {
  ValidarCancelamentoAgendamentoInput,
  ValidarConclusaoAgendamentoInput,
  ValidarCriacaoAgendamentoInput,
  ValidarFaltaAgendamentoInput,
  ValidarRemarcacaoAgendamentoInput,
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

  validarFalta({
    estado,
    inicioEm,
    agora,
  }: ValidarFaltaAgendamentoInput): void {
    if (estado === 'reservado') {
      throw new BadRequestException(
        'Só é possível marcar falta em um agendamento confirmado.',
      );
    }

    if (estado !== 'agendado') {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    // Antes do horário marcado não existe atraso: marcar falta ali é erro de
    // operação, não no-show. Depois disso a marcação é livre, e a tolerância
    // apenas gradua o aviso que o detalhe já devolve.
    if (agora.getTime() < inicioEm.getTime()) {
      throw new BadRequestException('O atendimento ainda não começou.');
    }
  }

  validarCancelamento({ estado }: ValidarCancelamentoAgendamentoInput): void {
    if (estado !== 'agendado' && estado !== 'reservado') {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }
  }

  validarRemarcacao({
    estado,
    inicioEmAtual,
    inicioEmNovo,
    avaliacao,
    confirmarExcecoes,
  }: ValidarRemarcacaoAgendamentoInput): void {
    if (estado === 'reservado') {
      throw new BadRequestException(
        'Só é possível remarcar um agendamento confirmado.',
      );
    }

    if (estado !== 'agendado') {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    if (inicioEmNovo.getTime() === inicioEmAtual.getTime()) {
      throw new BadRequestException('O agendamento já está nesse horário.');
    }

    if (avaliacao.bloqueios.includes('inicio_passado')) {
      throw new BadRequestException(
        'Não é possível remarcar para um horário que já passou.',
      );
    }

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
        'Confirme as exceções do horário antes de remarcar.',
      );
    }
  }
}
