import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { HorariosLivresResponseDto } from '@fluy/schema';
import { IonButton, IonInput, IonSpinner, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-escolha-horario',
  standalone: true,
  imports: [IonButton, IonInput, IonSpinner, IonText],
  templateUrl: './escolha-horario.component.html',
  styleUrls: ['./escolha-horario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscolhaHorarioComponent {
  readonly data = input<string>('');
  readonly dataMinima = input.required<string>();
  readonly horarios = input<HorariosLivresResponseDto['horarios']>([]);
  readonly horaSelecionada = input<string | null>(null);
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);

  readonly alterarData = output<string>();
  readonly selecionarHora = output<string>();

  aoAlterarData(valor: string | null | undefined): void {
    if (valor) this.alterarData.emit(valor);
  }
}
