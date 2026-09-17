import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  AvaliacaoHorarioAgendamentoResponseDto,
  CriarAgendamentoDto,
  HorariosLivresResponseDto,
} from '@fluy/schema';
import { criarAgendamentoSchema } from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import { AgendamentosService } from '@app/features/salao/agendamentos/services/agendamentos.service';
import { ClientesService } from '@app/features/salao/clientes/services/clientes.service';
import { ProcedimentosService } from '@app/features/salao/procedimentos/services/procedimentos.service';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { zodValidator } from '@app/shared/utils/zod-validator';

@Component({
  selector: 'app-agendamento-manual',
  templateUrl: './agendamento-manual.page.html',
  styleUrls: ['./agendamento-manual.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    ReactiveFormsModule,
  ],
})
export class AgendamentoManualPage implements OnInit {
  private readonly agendamentosService = inject(AgendamentosService);
  private readonly clientesService = inject(ClientesService);
  private readonly procedimentosService = inject(ProcedimentosService);

  readonly clientes = this.clientesService.clientes;
  readonly procedimentos = this.procedimentosService.procedimentos;
  readonly agendamentoCriado = this.agendamentosService.agendamentoCriado;
  readonly inicioAgendamentoFormatado = computed(() => {
    const inicioEm = this.agendamentoCriado()?.inicio_em;

    if (!inicioEm) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(inicioEm));
  });
  readonly horarios = signal<HorariosLivresResponseDto['horarios']>([]);
  readonly avaliacao = signal<AvaliacaoHorarioAgendamentoResponseDto | null>(
    null,
  );
  readonly carregandoInicial = signal(true);
  readonly carregandoHorarios = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly confirmacaoExigida = signal(false);

  readonly procedimentosDisponiveis = computed(() =>
    [...this.procedimentos()].sort(
      (a, b) => Number(b.ativo) - Number(a.ativo),
    ),
  );

  readonly formulario = new FormGroup(
    {
      cliente_id: new FormControl('', { nonNullable: true }),
      procedimento_id: new FormControl('', { nonNullable: true }),
      data: new FormControl('', { nonNullable: true }),
      hora_inicio: new FormControl('', { nonNullable: true }),
      confirmar_excecoes: new FormControl(false, { nonNullable: true }),
    },
    {
      updateOn: 'change',
      validators: [zodValidator(criarAgendamentoSchema)],
    },
  );

  ngOnInit(): void {
    void this.carregarDadosIniciais();
  }

  async carregarHorarios(): Promise<void> {
    const procedimentoId = this.formulario.controls.procedimento_id.value;
    const data = this.formulario.controls.data.value;

    this.formulario.controls.hora_inicio.setValue('');
    this.horarios.set([]);
    this.avaliacao.set(null);
    this.confirmacaoExigida.set(false);

    if (!procedimentoId || !data) {
      return;
    }

    this.carregandoHorarios.set(true);
    this.erro.set(null);

    try {
      const resposta = await this.agendamentosService.getHorariosLivres({
        procedimento_id: procedimentoId,
        data,
      });

      this.horarios.set(resposta.horarios);
    } catch (error) {
      this.tratarErro(error);
    } finally {
      this.carregandoHorarios.set(false);
    }
  }

  async selecionarHorario(horaInicio: string): Promise<void> {
    this.formulario.controls.hora_inicio.setValue(horaInicio);
    this.avaliacao.set(null);
    this.confirmacaoExigida.set(false);
    await this.avaliarHorarioSelecionado();
  }

  async enviarFormulario(): Promise<void> {
    this.formulario.markAllAsTouched();

    const resultado = criarAgendamentoSchema.safeParse(
      this.formulario.getRawValue(),
    );

    if (!resultado.success) {
      this.erro.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    const avaliacao = this.avaliacao();

    if (!avaliacao || avaliacao.status === 'indisponivel') {
      this.erro.set('Escolha um horário disponível.');
      return;
    }

    if (
      avaliacao.status === 'requer_confirmacao' &&
      !resultado.data.confirmar_excecoes
    ) {
      this.confirmacaoExigida.set(true);
      return;
    }

    await this.criarAgendamento(resultado.data);
  }

  async confirmarExcecoes(): Promise<void> {
    this.formulario.controls.confirmar_excecoes.setValue(true);
    this.confirmacaoExigida.set(false);
    await this.enviarFormulario();
  }

  cancelarConfirmacao(): void {
    this.formulario.controls.confirmar_excecoes.setValue(false);
    this.confirmacaoExigida.set(false);
  }

  private async carregarDadosIniciais(): Promise<void> {
    this.carregandoInicial.set(true);
    this.erro.set(null);

    try {
      await Promise.all([
        this.clientesService.getLista('ativos'),
        this.procedimentosService.getLista(),
      ]);
    } catch (error) {
      this.tratarErro(error);
    } finally {
      this.carregandoInicial.set(false);
    }
  }

  async avaliarHorarioSelecionado(): Promise<void> {
    const procedimentoId = this.formulario.controls.procedimento_id.value;
    const data = this.formulario.controls.data.value;
    const horaInicio = this.formulario.controls.hora_inicio.value;

    if (!procedimentoId || !data || !horaInicio) {
      return;
    }

    this.erro.set(null);

    try {
      const avaliacao = await this.agendamentosService.avaliarHorario({
        procedimento_id: procedimentoId,
        data,
        hora_inicio: horaInicio,
      });

      this.avaliacao.set(avaliacao);
    } catch (error) {
      this.tratarErro(error);
    }
  }

  private async criarAgendamento(dados: CriarAgendamentoDto): Promise<void> {
    this.salvando.set(true);
    this.erro.set(null);

    try {
      await this.agendamentosService.setEntidade(dados);
      this.formulario.reset({ confirmar_excecoes: false });
      this.horarios.set([]);
      this.avaliacao.set(null);
    } catch (error) {
      this.tratarErro(error);
    } finally {
      this.salvando.set(false);
    }
  }

  private tratarErro(error: unknown): void {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    this.erro.set(error.message);
  }
}
