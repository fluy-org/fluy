import { Pipe, PipeTransform } from '@angular/core';
import type {
  AvisoAvaliacaoAgendamento,
  BloqueioAvaliacaoAgendamento,
} from '@fluy/schema';

type MotivoAvaliacao =
  | AvisoAvaliacaoAgendamento
  | BloqueioAvaliacaoAgendamento;

const ROTULO_MOTIVO_AVALIACAO: Record<MotivoAvaliacao, string> = {
  fora_janela: 'Está fora da janela de atendimento configurada.',
  inicio_passado: 'Este horário já passou.',
  antes_antecedencia_minima:
    'Está abaixo da antecedência mínima configurada para agendar.',
  apos_antecedencia_maxima:
    'Está além da antecedência máxima configurada para agendar.',
  fora_da_grade: 'Não cai na grade de horários do salão.',
  sem_profissional_disponivel:
    'Nenhuma profissional está disponível neste horário.',
  cruza_meia_noite: 'O atendimento passaria da meia-noite.',
  dia_fechado: 'Esta data está marcada como sem atendimento.',
};

@Pipe({
  name: 'rotuloAvaliacao',
  standalone: true,
})
export class RotuloAvaliacaoPipe implements PipeTransform {
  transform(motivo: MotivoAvaliacao): string {
    return ROTULO_MOTIVO_AVALIACAO[motivo] ?? motivo;
  }
}
