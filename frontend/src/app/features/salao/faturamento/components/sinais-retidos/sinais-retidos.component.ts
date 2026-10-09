import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SinalRetidoResponseDto } from '@fluy/schema';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonIcon,
  IonItem,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, chevronForwardOutline } from 'ionicons/icons';
import { ROTULO_MOTIVO_SINAL_RETIDO } from '@app/features/salao/faturamento/faturamento-data';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-sinais-retidos',
  templateUrl: './sinais-retidos.component.html',
  styleUrls: ['./sinais-retidos.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HoraSalaoPipe,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonIcon,
    IonItem,
    IonList,
    IonText,
  ],
})
export class SinaisRetidosComponent {
  readonly sinaisRetidos = input.required<SinalRetidoResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly rotuloMotivo = ROTULO_MOTIVO_SINAL_RETIDO;
  readonly formatarValor = formatarValor;

  constructor() {
    addIcons({ arrowForwardOutline, chevronForwardOutline });
  }
}
