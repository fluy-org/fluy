import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResumoFaturamentoDto } from '@fluy/schema';
import { IonCard, IonCardContent, IonText } from '@ionic/angular/standalone';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-resumo-faturamento',
  templateUrl: './resumo-faturamento.component.html',
  styleUrls: ['./resumo-faturamento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCard, IonCardContent, IonText],
})
export class ResumoFaturamentoComponent {
  readonly resumo = input.required<ResumoFaturamentoDto>();
  readonly formatarValor = formatarValor;
}
