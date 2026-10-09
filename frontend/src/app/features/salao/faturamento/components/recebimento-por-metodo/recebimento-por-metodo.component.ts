import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RecebimentoPorMetodoDto } from '@fluy/schema';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonItem,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import {
  ROTULO_METODO_FATURAMENTO,
  ROTULO_ORIGEM_FATURAMENTO,
} from '@app/features/salao/faturamento/faturamento-data';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-recebimento-por-metodo',
  templateUrl: './recebimento-por-metodo.component.html',
  styleUrls: ['./recebimento-por-metodo.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCard, IonCardContent, IonCardHeader, IonItem, IonList, IonText],
})
export class RecebimentoPorMetodoComponent {
  readonly recebimentos = input.required<RecebimentoPorMetodoDto[]>();
  readonly rotuloMetodo = ROTULO_METODO_FATURAMENTO;
  readonly rotuloOrigem = ROTULO_ORIGEM_FATURAMENTO;
  readonly formatarValor = formatarValor;
}
