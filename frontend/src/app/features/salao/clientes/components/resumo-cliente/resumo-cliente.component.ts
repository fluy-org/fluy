import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { ClienteListaItemResponseDto } from '@fluy/schema';
import {
  IonBadge,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { formatarWhatsapp } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-resumo-cliente',
  templateUrl: './resumo-cliente.component.html',
  styleUrls: ['./resumo-cliente.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonBadge, IonCard, IonCardContent, HoraSalaoPipe],
})
export class ResumoClienteComponent {
  readonly cliente = input.required<ClienteListaItemResponseDto>();
  readonly fusoHorario = input.required<string>();
  readonly abrir = output<string>();

  readonly whatsapp = computed(() => formatarWhatsapp(this.cliente().whatsapp));
}
