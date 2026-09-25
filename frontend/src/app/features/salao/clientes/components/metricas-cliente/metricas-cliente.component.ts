import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { MetricasClienteDto } from '@fluy/schema';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { formatarValor } from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-metricas-cliente',
  templateUrl: './metricas-cliente.component.html',
  styleUrls: ['./metricas-cliente.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HoraSalaoPipe],
})
export class MetricasClienteComponent {
  readonly metricas = input.required<MetricasClienteDto>();
  readonly fusoHorario = input.required<string>();

  readonly totalGasto = computed(() =>
    formatarValor(this.metricas().total_gasto),
  );
}
