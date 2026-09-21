import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { AvisoAvaliacaoAgendamento } from '@fluy/schema';
import { IonButton } from '@ionic/angular/standalone';
import { RotuloAvaliacaoPipe } from '../../pipes/rotulo-avaliacao.pipe';

@Component({
  selector: 'app-confirmacao-encaixe',
  templateUrl: './confirmacao-encaixe.component.html',
  styleUrls: ['./confirmacao-encaixe.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, RotuloAvaliacaoPipe],
})
export class ConfirmacaoEncaixeComponent {
  readonly acao = input.required<string>();
  readonly avisos = input<AvisoAvaliacaoAgendamento[]>([]);

  readonly confirmar = output<void>();
  readonly voltar = output<void>();
}
