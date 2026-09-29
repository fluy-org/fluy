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
import type { LembreteResponseDto } from '@fluy/schema';
import { criarLembreteSchema } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { zodValidator } from '@app/shared/utils/zod-validator';

// Criar e editar pedem os mesmos dois campos; o vínculo com cliente e
// agendamento vem do escopo de quem abre o formulário.
const dadosLembreteSchema = criarLembreteSchema.pick({
  texto: true,
  data_alvo: true,
});

@Component({
  selector: 'app-formulario-lembrete',
  templateUrl: './formulario-lembrete.component.html',
  styleUrls: ['./formulario-lembrete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class FormularioLembreteComponent {
  // Nulo cria; preenchido edita o lembrete informado.
  readonly lembrete = input<LembreteResponseDto | null>(null);
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly salvar = output<{ texto: string; data_alvo: string }>();
  readonly cancelar = output<void>();
  readonly erroValidacao = signal<string | null>(null);

  readonly titulo = computed(() =>
    this.lembrete() ? 'Editar lembrete' : 'Adicionar lembrete',
  );

  readonly formulario = new FormGroup({
    texto: new FormControl('', {
      nonNullable: true,
      validators: zodValidator(dadosLembreteSchema.shape.texto),
    }),
    data_alvo: new FormControl('', {
      nonNullable: true,
      validators: zodValidator(dadosLembreteSchema.shape.data_alvo),
    }),
  });

  constructor() {
    effect(() => this.preencherFormulario(this.lembrete()));
  }

  mudarData(valor: string | number | null | undefined): void {
    this.formulario.controls.data_alvo.setValue(valor ? String(valor) : '');
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    const resultado = dadosLembreteSchema.safeParse(
      this.formulario.getRawValue(),
    );

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

  private preencherFormulario(lembrete: LembreteResponseDto | null): void {
    this.erroValidacao.set(null);
    this.formulario.reset({
      texto: lembrete?.texto ?? '',
      data_alvo: lembrete?.data_alvo ?? '',
    });
  }
}
