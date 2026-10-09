import type { FormControl, FormGroup } from '@angular/forms';
import type { PresetPeriodoFaturamento } from '@fluy/schema';

export type SelecaoPeriodoFaturamento =
  | PresetPeriodoFaturamento
  | 'customizado';

export type FormularioPeriodoCustomizado = FormGroup<{
  data_inicio: FormControl<string>;
  data_fim: FormControl<string>;
}>;
