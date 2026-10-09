import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AtendimentoFaturamentoResponseDto } from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, chevronForwardOutline } from 'ionicons/icons';
import { PagamentoFaturamentoComponent } from '@app/features/salao/faturamento/components/pagamento-faturamento/pagamento-faturamento.component';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-atendimentos-realizados',
  templateUrl: './atendimentos-realizados.component.html',
  styleUrls: ['./atendimentos-realizados.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PagamentoFaturamentoComponent,
    HoraSalaoPipe,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonIcon,
    IonText,
  ],
})
export class AtendimentosRealizadosComponent {
  readonly atendimentos = input.required<AtendimentoFaturamentoResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly erroPaginacao = input<string | null>(null);
  readonly carregandoMais = input(false);
  readonly tentarNovamente = output<void>();
  readonly formatarValor = formatarValor;

  constructor() {
    addIcons({ arrowForwardOutline, chevronForwardOutline });
  }
}
