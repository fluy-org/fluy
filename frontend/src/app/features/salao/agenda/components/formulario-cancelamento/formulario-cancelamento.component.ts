import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { CancelarAgendamentoDto } from '@fluy/schema';
import { cancelarAgendamentoSchema } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { zodValidator } from '../../../../../shared/utils/zod-validator';

@Component({
  selector: 'app-formulario-cancelamento',
  templateUrl: './formulario-cancelamento.component.html',
  styleUrls: ['./formulario-cancelamento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class FormularioCancelamentoComponent {
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly confirmar = output<CancelarAgendamentoDto>();
  readonly cancelar = output<void>();

  readonly erroValidacao = signal<string | null>(null);

  readonly formulario = new FormGroup({
    motivo: new FormControl('', {
      nonNullable: true,
      validators: zodValidator(cancelarAgendamentoSchema.shape.motivo),
    }),
  });

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    const resultado = cancelarAgendamentoSchema.safeParse(
      this.formulario.getRawValue(),
    );

    if (!resultado.success) {
      this.erroValidacao.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    this.confirmar.emit(resultado.data);
  }

  cancelarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.erroValidacao.set(null);
    this.cancelar.emit();
  }
}
