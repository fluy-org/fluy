import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { HorariosLivresResponseDto } from '@fluy/schema';
import {
  IonButton,
  IonInput,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-seletor-horario',
  templateUrl: './seletor-horario.component.html',
  styleUrls: ['./seletor-horario.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonInput, IonSpinner, IonText],
})
export class SeletorHorarioComponent {
  readonly horarios = input<HorariosLivresResponseDto['horarios']>([]);
  readonly horarioSelecionado = input('');
  readonly carregando = input(false);
  readonly desabilitado = input(false);

  readonly escolher = output<string>();

  escolherHorario(horaInicio: string): void {
    this.escolher.emit(horaInicio);
  }

  escolherHorarioManual(valor: unknown): void {
    if (typeof valor === 'string') {
      this.escolher.emit(valor);
    }
  }
}
