import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RecebimentoPorMetodoDto } from '@fluy/schema';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonItem,
  IonList,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import {
  ROTULO_METODO_FATURAMENTO,
  ROTULO_ORIGEM_FATURAMENTO,
} from '@app/features/salao/faturamento/faturamento-data';
import { formatarValor } from '@app/shared/utils/formatacao';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  cardOutline,
  diamondOutline,
  walletOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-recebimento-por-metodo',
  templateUrl: './recebimento-por-metodo.component.html',
  styleUrls: ['./recebimento-por-metodo.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonItem,
    IonList,
    IonText,
    IonIcon,
  ],
})
export class RecebimentoPorMetodoComponent {
  constructor() {
    addIcons({ cashOutline, cardOutline, diamondOutline, walletOutline });
  }
  iconeMetodo(metodo: RecebimentoPorMetodoDto['metodo']): string {
    if (metodo === 'dinheiro') return 'cash-outline';
    if (metodo === 'pix' || metodo === 'pix_pessoal') return 'diamond-outline';
    if (metodo === 'cartao' || metodo === 'cartao_maquina')
      return 'card-outline';
    return 'wallet-outline';
  }
  readonly recebimentos = input.required<RecebimentoPorMetodoDto[]>();
  readonly rotuloMetodo = ROTULO_METODO_FATURAMENTO;
  readonly rotuloOrigem = ROTULO_ORIGEM_FATURAMENTO;
  readonly formatarValor = formatarValor;
}
