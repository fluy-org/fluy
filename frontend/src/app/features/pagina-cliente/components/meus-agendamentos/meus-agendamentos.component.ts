import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type {
  AgendamentoClienteResponseDto,
  AgendamentoPublicoDetalheResponseDto,
  EstadoAgendamento,
} from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonImg,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ESTILO_ESTADO_AGENDAMENTO } from '@app/shared/utils/estado-agendamento';
import { formatarValor } from '@app/shared/utils/formatacao';
import type { ReferenciaAgendamentoVisual } from '@app/features/pagina-cliente/contracts';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonImg,
    IonSpinner,
    IonText,
  ],
  templateUrl: './meus-agendamentos.component.html',
  styleUrls: ['./meus-agendamentos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeusAgendamentosComponent {
  readonly agendamentos = input.required<AgendamentoClienteResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly detalhe = input<AgendamentoPublicoDetalheResponseDto | null>(null);
  readonly carregandoDetalhe = input(false);
  readonly referencias = input<ReferenciaAgendamentoVisual[]>([]);
  readonly carregandoReferencias = input(false);
  readonly erroReferencias = input<string | null>(null);
  readonly confirmandoCancelamento = input(false);
  readonly cancelando = input(false);
  readonly erroCancelamento = input<string | null>(null);

  readonly voltar = output<void>();
  readonly selecionar = output<string>();
  readonly fecharDetalhe = output<void>();
  readonly solicitarCancelamento = output<void>();
  readonly desistirCancelamento = output<void>();
  readonly confirmarCancelamento = output<void>();
  readonly tentarNovamente = output<void>();

  obterRotuloEstado(estado: EstadoAgendamento): string {
    return ESTILO_ESTADO_AGENDAMENTO[estado].rotulo;
  }

  obterCorEstado(estado: EstadoAgendamento): string {
    return ESTILO_ESTADO_AGENDAMENTO[estado].cor;
  }

  formatarDataHora(instante: string, fusoHorario = this.fusoHorario()): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: fusoHorario,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(instante));
  }

  formatarDuracao(duracaoMin: number): string {
    const horas = Math.floor(duracaoMin / 60);
    const minutos = duracaoMin % 60;

    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  }

  formatarPreco(valor: number): string {
    return formatarValor(valor);
  }
}
