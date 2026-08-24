import {
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import type { z } from 'zod';
import { validationError } from './validation-error';

export function zodValidator(schema: z.ZodType): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const resultado = schema.safeParse(control.value);

    if (resultado.success) {
      return null;
    }

    const primeiraIssue = resultado.error.issues[0];

    return primeiraIssue ? validationError(primeiraIssue.message) : null;
  };
}
