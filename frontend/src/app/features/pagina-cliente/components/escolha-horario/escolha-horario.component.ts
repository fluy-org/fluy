import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { HorariosLivresResponseDto } from '@fluy/schema';
import { IonButton, IonSpinner, IonText } from '@ionic/angular/standalone';
import { CalendarioMesComponent } from '@app/features/salao/agenda/components/calendario-mes/calendario-mes.component';
import type { GradeDoMes } from '@app/features/salao/agenda/contracts';

@Component({
  selector: 'app-escolha-horario',
  standalone: true,
  imports: [IonButton, IonSpinner, IonText, CalendarioMesComponent],
  templateUrl: './escolha-horario.component.html',
  styleUrls: ['./escolha-horario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscolhaHorarioComponent {
  readonly mes = input.required<string>();
  readonly grade = input.required<GradeDoMes>();
  readonly data = input<string>('');
  readonly horarios = input<HorariosLivresResponseDto['horarios']>([]);
  readonly horaSelecionada = input<string | null>(null);
  readonly carregandoHorarios = input(false);
  readonly carregandoDias = input(false);
  readonly erro = input<string | null>(null);

  readonly mudarMes = output<string>();
  readonly selecionarData = output<string>();
  readonly selecionarHora = output<string>();

  readonly dataFormatada = computed(() => {
    const data = this.data();
    if (!data) return '';
    const [ano, mes, dia] = data.split('-').map(Number);
    const dt = new Date(Date.UTC(ano, mes - 1, dia));
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dt);
  });
}
