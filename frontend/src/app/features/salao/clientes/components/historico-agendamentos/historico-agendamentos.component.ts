import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { AgendamentoClienteResponseDto } from '@fluy/schema';
import {
  InfiniteScrollCustomEvent,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { ESTILO_ESTADO_AGENDAMENTO } from '@app/shared/utils/estado-agendamento';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-historico-agendamentos',
  templateUrl: './historico-agendamentos.component.html',
  styleUrls: ['./historico-agendamentos.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HoraSalaoPipe,
    IonBadge,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
  ],
})
export class HistoricoAgendamentosComponent {
  readonly agendamentos = input.required<AgendamentoClienteResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly temMais = input(false);
  readonly abrir = output<string>();
  readonly carregarMais = output<InfiniteScrollCustomEvent>();

  readonly estiloEstado = ESTILO_ESTADO_AGENDAMENTO;
  readonly formatarValor = formatarValor;
}
