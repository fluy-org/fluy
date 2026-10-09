import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PagamentoFaturamentoDto } from '@fluy/schema';
import { IonText } from '@ionic/angular/standalone';
import {
  ROTULO_METODO_FATURAMENTO,
  ROTULO_ORIGEM_FATURAMENTO,
} from '@app/features/salao/faturamento/faturamento-data';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-pagamento-faturamento',
  templateUrl: './pagamento-faturamento.component.html',
  styleUrls: ['./pagamento-faturamento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonText],
})
export class PagamentoFaturamentoComponent {
  readonly pagamento = input.required<PagamentoFaturamentoDto | null>();
  readonly formatarValor = formatarValor;
  readonly rotuloMetodo = ROTULO_METODO_FATURAMENTO;
  readonly rotuloOrigem = ROTULO_ORIGEM_FATURAMENTO;
}
