import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { IonNote } from '@ionic/angular/standalone';
import {
  VALIDATION_ERROR,
  type ValidationError,
} from '../../utils/validation-error';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [IonNote],
  templateUrl: './field-error.component.html',
  styleUrls: ['./field-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly control = input.required<AbstractControl>();

  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  mensagemErro(): string | null {
    const erro = this.control().errors?.[VALIDATION_ERROR] as
      | ValidationError
      | undefined;

    return erro?.message ?? null;
  }
}
