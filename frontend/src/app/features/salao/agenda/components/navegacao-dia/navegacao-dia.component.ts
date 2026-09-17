import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import {
  IonButton,
  IonDatetime,
  IonIcon,
  IonModal,
} from '@ionic/angular/standalone';
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
  imports: [IonButton, IonDatetime, IonIcon, IonModal],
})
export class NavegacaoDiaComponent {
  readonly data = input.required<string>();
  readonly desabilitado = input(false);
  readonly mudarDia = output<string>();

  readonly seletorAberto = signal(false);
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

  abrirSeletor(): void {
    this.seletorAberto.set(true);
  }

  fecharSeletor(): void {
    this.seletorAberto.set(false);
  }

  selecionarData(valor: string | string[] | null | undefined): void {
    const dataSelecionada = Array.isArray(valor) ? valor[0] : valor;

    if (!dataSelecionada) {
      return;
    }

    this.seletorAberto.set(false);
    this.mudarDia.emit(dataSelecionada.slice(0, 10));
  }
}
