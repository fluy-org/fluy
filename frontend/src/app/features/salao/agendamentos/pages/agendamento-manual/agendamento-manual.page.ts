import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type {
  AvaliacaoHorarioAgendamentoResponseDto,
  CriarAgendamentoDto,
  CriarClienteDto,
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
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import { ConfirmacaoEncaixeComponent } from '@app/shared/components/confirmacao-encaixe/confirmacao-encaixe.component';
import { SeletorHorarioComponent } from '@app/shared/components/seletor-horario/seletor-horario.component';
import { RotuloAvaliacaoPipe } from '@app/shared/pipes/rotulo-avaliacao.pipe';
import { AgendamentosService } from '@app/features/salao/agendamentos/services/agendamentos.service';
import { FormularioClienteComponent } from '@app/features/salao/clientes/components/formulario-cliente/formulario-cliente.component';
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
    ConfirmacaoEncaixeComponent,
    FormularioClienteComponent,
    HeaderComponent,
    SeletorHorarioComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonModal,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    ReactiveFormsModule,
    RotuloAvaliacaoPipe,
  ],
})
export class AgendamentoManualPage implements OnInit {
  private readonly agendamentosService = inject(AgendamentosService);
  private readonly clientesService = inject(ClientesService);
  private readonly procedimentosService = inject(ProcedimentosService);
  private readonly router = inject(Router);

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
  readonly termoPesquisaCliente = signal('');
  readonly formularioClienteAberto = signal(false);
  readonly salvandoCliente = signal(false);
  readonly erroFormularioCliente = signal<string | null>(null);
  readonly etapaAberta = signal<1 | 2 | 3>(1);

  readonly clientesFiltrados = computed(() => {
    const termoInformado = this.termoPesquisaCliente();
    const termo = this.normalizarTexto(termoInformado);
    const digitos = termoInformado.replace(/\D/g, '');

    return this.clientes().filter((cliente) => {
      const nomeCorresponde = this.normalizarTexto(cliente.nome).includes(termo);
      const whatsappCorresponde =
        digitos.length > 0 && cliente.whatsapp.includes(digitos);

      return termo.length === 0 || nomeCorresponde || whatsappCorresponde;
    });
  });

  clienteSelecionada() {
    const clienteId = this.formulario.controls.cliente_id.value;

    return this.clientes().find((cliente) => cliente.id === clienteId) ?? null;
  }

  procedimentoSelecionado() {
    const procedimentoId = this.formulario.controls.procedimento_id.value;

    return (
      this.procedimentos().find(
        (procedimento) => procedimento.id === procedimentoId,
      ) ?? null
    );
  }

  resumoDataHorario(): string {
    const data = this.formulario.controls.data.value;
    const hora = this.formulario.controls.hora_inicio.value;

    if (!data) {
      return 'Escolha a data e um horário disponível.';
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataFormatada = new Intl.DateTimeFormat('pt-BR').format(
      new Date(ano, mes - 1, dia),
    );

    return hora ? `${dataFormatada} · ${hora}` : dataFormatada;
  }

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

  atualizarPesquisaCliente(valor: string | null | undefined): void {
    this.termoPesquisaCliente.set(valor?.trim() ?? '');
  }

  selecionarCliente(clienteId: string): void {
    this.formulario.controls.cliente_id.setValue(clienteId);
    this.termoPesquisaCliente.set('');
    this.etapaAberta.set(2);
  }

  alternarEtapa(etapa: 1 | 2 | 3): void {
    this.etapaAberta.set(etapa);
  }

  async selecionarProcedimento(): Promise<void> {
    await this.carregarHorarios();

    if (this.formulario.controls.procedimento_id.value) {
      this.etapaAberta.set(3);
    }
  }

  cancelarAgendamento(): void {
    void this.router.navigate(['/painel/agenda']);
  }

  abrirFormularioCliente(): void {
    this.erroFormularioCliente.set(null);
    this.formularioClienteAberto.set(true);
  }

  fecharFormularioCliente(): void {
    if (this.salvandoCliente()) {
      return;
    }

    this.formularioClienteAberto.set(false);
    this.erroFormularioCliente.set(null);
  }

  async salvarCliente(dados: CriarClienteDto): Promise<void> {
    this.salvandoCliente.set(true);
    this.erroFormularioCliente.set(null);

    try {
      const clienteCriado = await this.clientesService.setEntidade(dados);

      this.selecionarCliente(clienteCriado.id);
      this.formularioClienteAberto.set(false);
    } catch (error) {
      this.erroFormularioCliente.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar a cliente.',
      );
    } finally {
      this.salvandoCliente.set(false);
    }
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

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }
}
