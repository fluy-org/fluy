import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  CriarProcedimentoDto,
  ProcedimentoResponseDto,
} from '@fluy/schema';
import { criarProcedimentoSchema } from '@fluy/schema';
import type { TipoSinal } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-formulario-procedimento',
  templateUrl: './formulario-procedimento.component.html',
  styleUrls: ['./formulario-procedimento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class FormularioProcedimentoComponent {
  // Quando recebe um procedimento, o mesmo formulario passa a operar em edicao.
  readonly procedimento = input<ProcedimentoResponseDto | null>(null);
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly salvar = output<CriarProcedimentoDto>();
  readonly cancelar = output<void>();
  readonly erroValidacao = signal<string | null>(null);

  readonly titulo = computed(() =>
    this.procedimento() ? 'Editar procedimento' : 'Novo procedimento',
  );

  readonly formulario = new FormGroup(
    {
      nome: new FormControl('', { nonNullable: true }),
      descricao: new FormControl('', { nonNullable: true }),
      info_pre_procedimento: new FormControl('', { nonNullable: true }),
      duracao_min: new FormControl<number | null>(null),
      preco: new FormControl<number | null>(null),
      tipo_sinal: new FormControl<TipoSinal>('fixo', { nonNullable: true }),
      valor_sinal: new FormControl<number | null>(null),
      periodo_manutencao_dias: new FormControl<number | null>(null),
    },
    { updateOn: 'blur' },
  );

  constructor() {
    // Mantem o mesmo formulario preparado tanto para criacao quanto para edicao.
    effect(() => this.preencherFormulario(this.procedimento()));
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    // O schema compartilhado garante que o frontend envie o contrato da API.
    const resultado = criarProcedimentoSchema.safeParse(this.dadosFormulario());

    if (!resultado.success) {
      this.erroValidacao.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    this.salvar.emit(resultado.data);
  }

  cancelarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.erroValidacao.set(null);
    this.cancelar.emit();
  }

  private preencherFormulario(
    procedimento: ProcedimentoResponseDto | null,
  ): void {
    this.erroValidacao.set(null);
    this.formulario.reset(
      procedimento
        ? {
            nome: procedimento.nome,
            descricao: procedimento.descricao ?? '',
            info_pre_procedimento: procedimento.info_pre_procedimento ?? '',
            duracao_min: procedimento.duracao_min,
            preco: procedimento.preco,
            tipo_sinal: procedimento.tipo_sinal,
            valor_sinal: procedimento.valor_sinal,
            periodo_manutencao_dias: procedimento.periodo_manutencao_dias,
          }
        : {
            nome: '',
            descricao: '',
            info_pre_procedimento: '',
            duracao_min: null,
            preco: null,
            tipo_sinal: 'fixo',
            valor_sinal: null,
            periodo_manutencao_dias: null,
          },
    );
  }

  private dadosFormulario(): unknown {
    const dados = this.formulario.getRawValue();

    return {
      ...dados,
      // Campo vazio vira undefined porque a manutencao e opcional na API.
      periodo_manutencao_dias: dados.periodo_manutencao_dias ?? undefined,
    };
  }
}
