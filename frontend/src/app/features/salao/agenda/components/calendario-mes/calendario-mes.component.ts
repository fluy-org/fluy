import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ROTULOS_DIAS_DA_SEMANA } from '@app/features/salao/agenda/agenda-data';
import {
  adicionarMesesNoMes,
  formatarMesPorExtenso,
} from '@app/features/salao/agenda/agenda-utils';
import type { GradeDoMes } from '@app/features/salao/agenda/contracts';

@Component({
  selector: 'app-calendario-mes',
  templateUrl: './calendario-mes.component.html',
  styleUrls: ['./calendario-mes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, IonSpinner, IonText],
})
export class CalendarioMesComponent {
  readonly mes = input.required<string>();
  readonly diaSelecionado = input.required<string>();
  readonly grade = input.required<GradeDoMes>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);

  readonly mudarMes = output<string>();
  readonly selecionarDia = output<string>();
  readonly tentarNovamente = output<void>();

  readonly rotulosDiasDaSemana = ROTULOS_DIAS_DA_SEMANA;
  readonly mesPorExtenso = computed(() => formatarMesPorExtenso(this.mes()));

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  irParaMesAnterior(): void {
    this.mudarMes.emit(adicionarMesesNoMes({ mes: this.mes(), meses: -1 }));
  }

  irParaProximoMes(): void {
    this.mudarMes.emit(adicionarMesesNoMes({ mes: this.mes(), meses: 1 }));
  }
}
