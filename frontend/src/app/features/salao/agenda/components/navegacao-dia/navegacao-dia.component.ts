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
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { formatarDataPorExtenso } from '@app/shared/utils/data-civil';
import {
  adicionarDiasNaData,
  formatarMesPorExtenso,
} from '@app/features/salao/agenda/agenda-utils';

@Component({
  selector: 'app-navegacao-dia',
  templateUrl: './navegacao-dia.component.html',
  styleUrls: ['./navegacao-dia.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, IonText],
})
export class NavegacaoDiaComponent {
  readonly data = input.required<string>();
  readonly desabilitado = input(false);
  readonly mudarDia = output<string>();
  readonly abrirCalendario = output<void>();

  readonly dataPorExtenso = computed(() => formatarDataPorExtenso(this.data()));
  readonly mes = computed(() => formatarMesPorExtenso(this.data().slice(0, 7)));
  readonly dias = computed(() =>
    Array.from({ length: 5 }, (_, indice) => {
      const data = adicionarDiasNaData({ data: this.data(), dias: indice - 2 });
      const [ano, mes, dia] = data.split('-').map(Number);
      const semana = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        timeZone: 'UTC',
      })
        .format(new Date(Date.UTC(ano, mes - 1, dia)))
        .replace('.', '');
      return { data, dia, semana, descricao: formatarDataPorExtenso(data) };
    }),
  );

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
