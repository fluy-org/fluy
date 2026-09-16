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
import type { ClienteResponseDto, CriarClienteDto } from '@fluy/schema';
import { criarClienteSchema } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { zodValidator } from '../../../../../shared/utils/zod-validator';

@Component({
  selector: 'app-formulario-cliente',
  templateUrl: './formulario-cliente.component.html',
  styleUrls: ['./formulario-cliente.component.scss'],
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
export class FormularioClienteComponent {
  readonly cliente = input<ClienteResponseDto | null>(null);
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly salvar = output<CriarClienteDto>();
  readonly cancelar = output<void>();
  readonly erroValidacao = signal<string | null>(null);

  readonly titulo = computed(() =>
    this.cliente() ? 'Editar cliente' : 'Novo cliente',
  );

  readonly formulario = new FormGroup(
    {
      nome: new FormControl('', { nonNullable: true }),
      whatsapp: new FormControl('', { nonNullable: true }),
      observacoes: new FormControl('', { nonNullable: true }),
    },
    {
      updateOn: 'blur',
      validators: [zodValidator(criarClienteSchema)],
    },
  );

  constructor() {
    effect(() => this.preencherFormulario(this.cliente()));
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    const resultado = criarClienteSchema.safeParse(this.dadosFormulario());

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

  // A máscara melhora a leitura no formulário; a normalização definitiva
  // continua pertencendo ao schema compartilhado antes do envio à API.
  formatarCampoWhatsapp(valor: string | null | undefined): void {
    const valorFormatado = this.formatarWhatsapp(valor ?? '');

    this.formulario.controls.whatsapp.setValue(valorFormatado, {
      emitEvent: false,
    });
  }

  private preencherFormulario(cliente: ClienteResponseDto | null): void {
    this.erroValidacao.set(null);
    this.formulario.reset({
      nome: cliente?.nome ?? '',
      whatsapp: this.formatarWhatsapp(cliente?.whatsapp ?? ''),
      observacoes: cliente?.observacoes ?? '',
    });
  }

  private formatarWhatsapp(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);

    if (digitos.length === 0) {
      return '';
    }

    if (digitos.length <= 2) {
      return `(${digitos}`;
    }

    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);
    const tamanhoPrefixo = numero.length > 8 ? 5 : 4;
    const prefixo = numero.slice(0, tamanhoPrefixo);
    const sufixo = numero.slice(tamanhoPrefixo);

    return `(${ddd}) ${prefixo}${sufixo ? `-${sufixo}` : ''}`;
  }

  private dadosFormulario(): unknown {
    const dados = this.formulario.getRawValue();
    const observacoes = dados.observacoes.trim();

    return {
      ...dados,
      observacoes: observacoes || undefined,
    };
  }
}
