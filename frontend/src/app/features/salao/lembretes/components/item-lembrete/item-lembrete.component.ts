import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { LembreteResponseDto } from '@fluy/schema';
import { IonBadge, IonButton } from '@ionic/angular/standalone';
import { formatarDataPorExtenso } from '@app/shared/utils/data-civil';

@Component({
  selector: 'app-item-lembrete',
  templateUrl: './item-lembrete.component.html',
  styleUrls: ['./item-lembrete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonBadge, IonButton],
})
export class ItemLembreteComponent {
  readonly lembrete = input.required<LembreteResponseDto>();
  // Data civil de hoje no fuso do salão, para comparar com a data alvo.
  readonly hoje = input.required<string>();
  readonly mostrarCliente = input(false);
  readonly somenteLeitura = input(false);

  readonly concluir = output<string>();
  readonly editar = output<LembreteResponseDto>();
  readonly excluir = output<LembreteResponseDto>();
  readonly abrirCliente = output<string>();

  readonly dataPorExtenso = computed(() =>
    formatarDataPorExtenso(this.lembrete().data_alvo),
  );
  readonly atrasado = computed(() => this.lembrete().data_alvo < this.hoje());
  readonly venceHoje = computed(
    () => this.lembrete().data_alvo === this.hoje(),
  );
}
