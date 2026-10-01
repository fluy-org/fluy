import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SalaoPublicoResponseDto } from '@fluy/schema';
import { IonIcon, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-cabecalho-publico',
  standalone: true,
  imports: [IonIcon, IonText],
  templateUrl: './cabecalho-publico.component.html',
  styleUrls: ['./cabecalho-publico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabecalhoPublicoComponent {
  readonly salao = input.required<SalaoPublicoResponseDto>();
}
