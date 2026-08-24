import type { ValidationErrors } from '@angular/forms';

export const VALIDATION_ERROR = 'validation';

export type ValidationError = {
  message: string;
};

export function validationError(message: string): ValidationErrors {
  return {
    [VALIDATION_ERROR]: { message } satisfies ValidationError,
  };
}
