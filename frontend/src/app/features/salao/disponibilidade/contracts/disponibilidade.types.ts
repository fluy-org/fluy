import type { FormControl, FormGroup } from '@angular/forms';

export type JanelaSemanalFormulario = FormGroup<{
  dia_semana: FormControl<number>;
  hora_inicio: FormControl<string>;
  hora_fim: FormControl<string>;
}>;
