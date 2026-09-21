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
  AvaliacaoHorarioAgendamentoResponseDto,
  HorariosLivresResponseDto,
  RemarcarAgendamentoDto,
} from '@fluy/schema';
import { remarcarAgendamentoSchema } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ConfirmacaoEncaixeComponent } from '../../../../../shared/components/confirmacao-encaixe/confirmacao-encaixe.component';
import { HoraSalaoPipe } from '../../../../../shared/pipes/hora-salao.pipe';
import { RotuloAvaliacaoPipe } from '../../../../../shared/pipes/rotulo-avaliacao.pipe';
import { SeletorHorarioComponent } from '../../../../../shared/components/seletor-horario/seletor-horario.component';
import { zodValidator } from '../../../../../shared/utils/zod-validator';
import { extrairDataCivil, formatarDataPorExtenso } from '../../agenda-utils';

@Component({
  selector: 'app-formulario-remarcacao',
  templateUrl: './formulario-remarcacao.component.html',
  styleUrls: ['./formulario-remarcacao.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ConfirmacaoEncaixeComponent,
    HoraSalaoPipe,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
    RotuloAvaliacaoPipe,
    SeletorHorarioComponent,
  ],
})
export class FormularioRemarcacaoComponent {
  readonly agendamento = input.required<AgendamentoDetalheResponseDto>();
  readonly horarios = input<HorariosLivresResponseDto['horarios']>([]);
  readonly carregandoHorarios = input(false);
  readonly avaliacao = input<AvaliacaoHorarioAgendamentoResponseDto | null>(
    null,
  );
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly escolherData = output<string>();
  readonly escolherHorario = output<string>();
  readonly confirmar = output<RemarcarAgendamentoDto>();
  readonly cancelar = output<void>();

  readonly confirmacaoExigida = signal(false);
  readonly erroValidacao = signal<string | null>(null);

  readonly formulario = new FormGroup(
    {
      data: new FormControl('', { nonNullable: true }),
      hora_inicio: new FormControl('', { nonNullable: true }),
      confirmar_excecoes: new FormControl(false, { nonNullable: true }),
    },
    {
      updateOn: 'change',
      validators: [zodValidator(remarcarAgendamentoSchema)],
    },
  );

  readonly dataAtualPorExtenso = computed(() =>
    formatarDataPorExtenso(
      extrairDataCivil({
        instante: this.agendamento().inicio_em,
        fusoHorario: this.agendamento().fuso_horario,
      }),
    ),
  );

  mudarData(valor: unknown): void {
    if (typeof valor !== 'string') {
      return;
    }

    this.formulario.patchValue({ data: valor, hora_inicio: '' });
    this.limparConfirmacao();
    this.escolherData.emit(valor);
  }

  mudarHorario(horaInicio: string): void {
    this.formulario.controls.hora_inicio.setValue(horaInicio);
    this.limparConfirmacao();
    this.escolherHorario.emit(horaInicio);
  }

  dataPorExtenso(data: string): string {
    return formatarDataPorExtenso(data);
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    const resultado = remarcarAgendamentoSchema.safeParse(
      this.formulario.getRawValue(),
    );

    if (!resultado.success) {
      this.erroValidacao.set(
        resultado.error.issues[0]?.message ?? 'Escolha a nova data e o horário.',
      );
      return;
    }

    const avaliacao = this.avaliacao();

    if (!avaliacao || avaliacao.status === 'indisponivel') {
      this.erroValidacao.set('Escolha um horário disponível.');
      return;
    }

    if (
      avaliacao.status === 'requer_confirmacao' &&
      !resultado.data.confirmar_excecoes
    ) {
      this.confirmacaoExigida.set(true);
      return;
    }

    this.confirmar.emit(resultado.data);
  }

  confirmarExcecoes(): void {
    this.formulario.controls.confirmar_excecoes.setValue(true);
    this.confirmacaoExigida.set(false);
    this.enviarFormulario();
  }

  cancelarConfirmacao(): void {
    this.formulario.controls.confirmar_excecoes.setValue(false);
    this.confirmacaoExigida.set(false);
  }

  cancelarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.cancelar.emit();
  }

  private limparConfirmacao(): void {
    this.formulario.controls.confirmar_excecoes.setValue(false);
    this.confirmacaoExigida.set(false);
    this.erroValidacao.set(null);
  }
}
