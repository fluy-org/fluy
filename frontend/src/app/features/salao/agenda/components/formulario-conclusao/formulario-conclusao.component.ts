import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  AgendamentoDetalheResponseDto,
  ConcluirAgendamentoDto,
  MetodoPagamentoManual,
} from '@fluy/schema';
import { METODO_PAGAMENTO_MANUAL, concluirAgendamentoSchema } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { zodValidator } from '../../../../../shared/utils/zod-validator';
import {
  ROTULO_AVISO_ACAO_AGENDAMENTO,
  ROTULO_METODO_PAGAMENTO_MANUAL,
} from '../../agenda-data';
import { formatarValor } from '../../../../../shared/utils/formatacao';

@Component({
  selector: 'app-formulario-conclusao',
  templateUrl: './formulario-conclusao.component.html',
  styleUrls: ['./formulario-conclusao.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class FormularioConclusaoComponent {
  readonly agendamento = input.required<AgendamentoDetalheResponseDto>();
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly confirmar = output<ConcluirAgendamentoDto>();
  readonly cancelar = output<void>();

  readonly valorNaoRecebido = signal(false);
  readonly erroValidacao = signal<string | null>(null);

  readonly metodos = METODO_PAGAMENTO_MANUAL.map((valor) => ({
    valor,
    rotulo: ROTULO_METODO_PAGAMENTO_MANUAL[valor],
  }));

  readonly metodoExigido = computed(() => this.agendamento().valor_pendente > 0);

  readonly avisoConclusaoAntecipada = computed(() =>
    this.agendamento().avisos.includes('conclusao_antecipada')
      ? ROTULO_AVISO_ACAO_AGENDAMENTO['conclusao_antecipada']
      : null,
  );

  readonly formulario = new FormGroup({
    metodo_pagamento: new FormControl<MetodoPagamentoManual | null>(null, {
      validators: zodValidator(concluirAgendamentoSchema.shape.metodo_pagamento),
    }),
  });

  alternarValorNaoRecebido(naoRecebido: boolean): void {
    this.erroValidacao.set(null);
    this.valorNaoRecebido.set(naoRecebido);

    const campoMetodo = this.formulario.controls.metodo_pagamento;

    if (naoRecebido) {
      campoMetodo.disable();
      return;
    }

    campoMetodo.enable();
  }

  valorFormatado(valor: number): string {
    return formatarValor(valor);
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.erroValidacao.set(null);
    const metodoPagamento = this.resolverMetodo();

    // O schema aceita `null` como "não recebeu", então quem obriga a escolha
    // consciente do fluxo 07 é a tela, não o contrato.
    if (this.metodoExigido() && !this.valorNaoRecebido() && !metodoPagamento) {
      this.erroValidacao.set(
        'Selecione o método do pagamento ou marque que não recebeu o valor pendente.',
      );
      return;
    }

    const resultado = concluirAgendamentoSchema.safeParse({
      metodo_pagamento: metodoPagamento,
    });

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

  private resolverMetodo(): MetodoPagamentoManual | null {
    if (!this.metodoExigido() || this.valorNaoRecebido()) {
      return null;
    }

    return this.formulario.getRawValue().metodo_pagamento;
  }
}
