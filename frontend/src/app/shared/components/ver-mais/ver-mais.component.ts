import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

// Paginação de seção dentro de uma página maior, onde a rolagem infinita
// dispararia junto com a da página.
@Component({
  selector: 'app-ver-mais',
  templateUrl: './ver-mais.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
})
export class VerMaisComponent {
  readonly carregando = input(false);
  readonly verMais = output<void>();
}
