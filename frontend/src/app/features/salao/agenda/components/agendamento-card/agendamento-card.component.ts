import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { AgendamentoAgendaResponseDto } from '@fluy/schema';
import { addIcons } from 'ionicons';
import { chatbubbleEllipsesOutline, imagesOutline } from 'ionicons/icons';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { ESTILO_ESTADO_AGENDAMENTO } from '@app/shared/utils/estado-agendamento';
import { formatarValor } from '@app/shared/utils/formatacao';
import { formatarDuracao } from '@app/features/salao/agenda/agenda-utils';

@Component({
  selector: 'app-agendamento-card',
  templateUrl: './agendamento-card.component.html',
  styleUrls: ['./agendamento-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonBadge, IonCard, IonCardContent, IonIcon, IonText, HoraSalaoPipe],
})
export class AgendamentoCardComponent {
  readonly agendamento = input.required<AgendamentoAgendaResponseDto>();
  readonly fusoHorario = input.required<string>();
  readonly abrir = output<string>();
  readonly compacto = input(false);

  readonly estilo = computed(
    () => ESTILO_ESTADO_AGENDAMENTO[this.agendamento().estado],
  );
  readonly duracao = computed(() =>
    formatarDuracao(this.agendamento().duracao_min),
  );
  readonly precoTotal = computed(() =>
    formatarValor(this.agendamento().preco_total),
  );
  readonly valorPago = computed(() =>
    formatarValor(this.agendamento().valor_pago),
  );
  readonly valorPendente = computed(() =>
    formatarValor(this.agendamento().valor_pendente),
  );

  constructor() {
    addIcons({ chatbubbleEllipsesOutline, imagesOutline });
  }
}
