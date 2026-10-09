import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  listarFaturamentoQuerySchema,
  PRESET_PERIODO_FATURAMENTO,
  type ListarFaturamentoQueryDto,
  type PeriodoFaturamentoDto,
} from '@fluy/schema';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import type {
  FormularioPeriodoCustomizado,
  SelecaoPeriodoFaturamento,
} from '@app/features/salao/faturamento/contracts';
import { ROTULO_PERIODO_FATURAMENTO } from '@app/features/salao/faturamento/faturamento-data';
import { FieldErrorComponent } from '@app/shared/components/field-error/field-error.component';
import { zodValidator } from '@app/shared/utils/zod-validator';
import { formatarDataPorExtenso } from '@app/shared/utils/data-civil';

@Component({
  selector: 'app-seletor-periodo',
  templateUrl: './seletor-periodo.component.html',
  styleUrls: ['./seletor-periodo.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FieldErrorComponent,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonText,
  ],
})
export class SeletorPeriodoComponent {
  readonly selecao = input.required<SelecaoPeriodoFaturamento>();
  readonly periodoAtual = input<PeriodoFaturamentoDto | null>(null);
  readonly intervaloAplicado = input<PeriodoFaturamentoDto | null>(null);
  readonly fusoHorario = input('');
  readonly carregando = input(false);
  readonly selecionar = output<SelecaoPeriodoFaturamento>();
  readonly aplicar = output<ListarFaturamentoQueryDto>();
  readonly presets = PRESET_PERIODO_FATURAMENTO;
  readonly rotulos = ROTULO_PERIODO_FATURAMENTO;

  readonly formulario: FormularioPeriodoCustomizado = new FormGroup(
    {
      data_inicio: new FormControl('', { nonNullable: true }),
      data_fim: new FormControl('', { nonNullable: true }),
    },
    {
      updateOn: 'change',
      validators: zodValidator(listarFaturamentoQuerySchema),
    },
  );

  constructor() {
    addIcons({ timeOutline });
    effect(() => {
      const intervalo = this.intervaloAplicado();
      if (intervalo) this.formulario.reset(intervalo);
    });
  }

  selecionarPeriodo(valor: SelecaoPeriodoFaturamento): void {
    if (valor === this.selecao()) return;

    if (valor === 'customizado') {
      this.formulario.reset(
        this.periodoAtual() ?? { data_inicio: '', data_fim: '' },
      );
      this.selecionar.emit(valor);
      return;
    }

    if (!this.presets.includes(valor)) return;
    this.selecionar.emit(valor);
    this.aplicar.emit({ periodo: valor });
  }

  aplicarIntervalo(): void {
    if (this.carregando()) return;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.aplicar.emit(this.formulario.getRawValue());
  }

  descreverDataCivil(data: string) {
    const [diaSemana, dataPorExtenso] =
      formatarDataPorExtenso(data).split(', ');

    return {
      diaSemana,
      data: `${dataPorExtenso} de ${data.slice(0, 4)}`,
    };
  }
}
