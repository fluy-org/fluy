import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { AgendamentoDetalheResponseDto } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ROTULO_AVISO_ACAO_AGENDAMENTO } from '../../agenda-data';
import { formatarValor } from '../../../../../shared/utils/formatacao';

@Component({
  selector: 'app-confirmacao-falta',
  templateUrl: './confirmacao-falta.component.html',
  styleUrls: ['./confirmacao-falta.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class ConfirmacaoFaltaComponent {
  readonly agendamento = input.required<AgendamentoDetalheResponseDto>();
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  readonly avisoAntesDaTolerancia = computed(() =>
    this.agendamento().avisos.includes('falta_antes_da_tolerancia')
      ? ROTULO_AVISO_ACAO_AGENDAMENTO['falta_antes_da_tolerancia']
      : null,
  );

  // O que o salão retém é o dinheiro que entrou, não o sinal congelado no
  // agendamento — mesma distinção que a 3.1 fixou para o card.
  readonly temValorRetido = computed(() => this.agendamento().valor_pago > 0);

  valorFormatado(valor: number): string {
    return formatarValor(valor);
  }

  confirmarFalta(): void {
    if (this.salvando()) {
      return;
    }

    this.confirmar.emit();
  }

  cancelarFalta(): void {
    if (this.salvando()) {
      return;
    }

    this.cancelar.emit();
  }
}
