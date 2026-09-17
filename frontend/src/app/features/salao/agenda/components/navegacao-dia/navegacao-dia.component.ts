import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import {
  adicionarDiasNaData,
  formatarDataPorExtenso,
} from '../../agenda-utils';

@Component({
  selector: 'app-navegacao-dia',
  templateUrl: './navegacao-dia.component.html',
  styleUrls: ['./navegacao-dia.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon],
})
export class NavegacaoDiaComponent {
  readonly data = input.required<string>();
  readonly desabilitado = input(false);
  readonly mudarDia = output<string>();
  readonly abrirCalendario = output<void>();

  readonly dataPorExtenso = computed(() => formatarDataPorExtenso(this.data()));

  constructor() {
    addIcons({ calendarOutline, chevronBackOutline, chevronForwardOutline });
  }

  irParaDiaAnterior(): void {
    this.mudarDia.emit(adicionarDiasNaData({ data: this.data(), dias: -1 }));
  }

  irParaProximoDia(): void {
    this.mudarDia.emit(adicionarDiasNaData({ data: this.data(), dias: 1 }));
  }
}
