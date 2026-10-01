import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ProcedimentoPublicoResponseDto } from '@fluy/schema';
import { IonCard, IonIcon, IonSpinner, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-catalogo-procedimentos',
  standalone: true,
  imports: [IonCard, IonIcon, IonSpinner, IonText],
  templateUrl: './catalogo-procedimentos.component.html',
  styleUrls: ['./catalogo-procedimentos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoProcedimentosComponent {
  readonly procedimentos = input.required<ProcedimentoPublicoResponseDto[]>();
  readonly procedimentoSelecionadoId = input<string | null>(null);
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);

  readonly selecionar = output<ProcedimentoPublicoResponseDto>();

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  formatarDuracao(duracaoMin: number): string {
    const horas = Math.floor(duracaoMin / 60);
    const minutos = duracaoMin % 60;

    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;

    return `${horas}h ${minutos}min`;
  }
}
