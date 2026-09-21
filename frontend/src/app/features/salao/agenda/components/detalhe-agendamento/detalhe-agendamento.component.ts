import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { AgendamentoDetalheResponseDto } from '@fluy/schema';
import { IonBadge } from '@ionic/angular/standalone';
import { HoraSalaoPipe } from '../../../../../shared/pipes/hora-salao.pipe';
import { ESTILO_ESTADO_AGENDAMENTO } from '../../agenda-data';
import {
  extrairDataCivil,
  formatarDataPorExtenso,
  formatarDuracao,
  formatarValor,
  formatarWhatsapp,
} from '../../agenda-utils';

@Component({
  selector: 'app-detalhe-agendamento',
  templateUrl: './detalhe-agendamento.component.html',
  styleUrls: ['./detalhe-agendamento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HoraSalaoPipe, IonBadge],
})
export class DetalheAgendamentoComponent {
  readonly agendamento = input.required<AgendamentoDetalheResponseDto>();

  readonly estilo = computed(
    () => ESTILO_ESTADO_AGENDAMENTO[this.agendamento().estado],
  );

  readonly duracao = computed(() =>
    formatarDuracao(this.agendamento().duracao_min),
  );

  readonly dataPorExtenso = computed(() =>
    formatarDataPorExtenso(
      extrairDataCivil({
        instante: this.agendamento().inicio_em,
        fusoHorario: this.agendamento().fuso_horario,
      }),
    ),
  );

  readonly whatsapp = computed(() =>
    formatarWhatsapp(this.agendamento().cliente.whatsapp),
  );

  valorFormatado(valor: number): string {
    return formatarValor(valor);
  }
}
