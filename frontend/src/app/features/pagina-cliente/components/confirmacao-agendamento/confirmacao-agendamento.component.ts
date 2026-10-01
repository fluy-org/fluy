import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type {
  ProcedimentoPublicoResponseDto,
  SalaoPublicoResponseDto,
} from '@fluy/schema';
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-confirmacao-agendamento',
  standalone: true,
  imports: [IonButton, IonIcon, IonText],
  templateUrl: './confirmacao-agendamento.component.html',
  styleUrls: ['./confirmacao-agendamento.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacaoAgendamentoComponent {
  readonly salao = input.required<SalaoPublicoResponseDto>();
  readonly procedimento = input.required<ProcedimentoPublicoResponseDto>();
  readonly data = input.required<string>();
  readonly hora = input.required<string>();
  readonly salvando = input(false);
  readonly erro = input<string | null>(null);

  readonly voltar = output<void>();
  readonly confirmar = output<void>();

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(
      new Date(ano!, mes! - 1, dia),
    );
  }

  formatarPreco(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}
