import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  atualizarDisponibilidadeSemanalSchema,
  type DisponibilidadeSemanalResponseDto,
} from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  trashOutline,
} from 'ionicons/icons';
import { ApiError } from '../../../../../core/errors/api-error';
import { HeaderComponent } from '../../../../../shared/components/header/header.component';
import type { JanelaSemanalFormulario } from '../../contracts';
import { DIAS_SEMANA } from '../../disponibilidade.data';
import { DisponibilidadeService } from '../../services/disponibilidade.service';

@Component({
  selector: 'app-disponibilidade',
  templateUrl: './disponibilidade.page.html',
  styleUrls: ['./disponibilidade.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonToggle,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class DisponibilidadePage implements OnInit {
  private readonly disponibilidadeService = inject(DisponibilidadeService);

  readonly profissionais = this.disponibilidadeService.profissionais;
  readonly disponibilidadeSemanal =
    this.disponibilidadeService.disponibilidadeSemanal;
  readonly profissionalSelecionadoId = signal<string | null>(null);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroFormulario = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);
  readonly janelasFormulario = signal<JanelaSemanalFormulario[]>([]);

  readonly profissionalSelecionado = computed(() =>
    this.profissionais().find(
      (profissional) => profissional.id === this.profissionalSelecionadoId(),
    ),
  );

  readonly diasSemana = computed(() => {
    const janelas = this.janelasFormulario();

    return DIAS_SEMANA.map((dia) => ({
      ...dia,
      janelas: janelas.filter(
        (janela) => janela.controls.dia_semana.value === dia.valor,
      ),
    }));
  });

  constructor() {
    addIcons({ addOutline, calendarOutline, trashOutline });
  }

  ngOnInit(): void {
    void this.carregarPagina();
  }

  async selecionarProfissional(profissionalId: string): Promise<void> {
    if (profissionalId === this.profissionalSelecionadoId()) {
      return;
    }

    this.profissionalSelecionadoId.set(profissionalId);
    await this.carregarDisponibilidade(profissionalId);
  }

  adicionarIntervalo(diaSemana: number): void {
    this.janelasFormulario.update((janelas) => [
      ...janelas,
      this.criarJanelaFormulario(diaSemana, '09:00', '18:00'),
    ]);
  }

  removerIntervalo(janelaRemovida: JanelaSemanalFormulario): void {
    this.janelasFormulario.update((janelas) =>
      janelas.filter((janela) => janela !== janelaRemovida),
    );
  }

  alterarDiaAtivo(diaSemana: number, ativo: boolean): void {
    const janelasDoDia = this.janelasFormulario().filter(
      (janela) => janela.controls.dia_semana.value === diaSemana,
    );

    if (ativo && janelasDoDia.length === 0) {
      this.adicionarIntervalo(diaSemana);
      return;
    }

    if (!ativo) {
      this.janelasFormulario.update((janelas) =>
        janelas.filter(
          (janela) => janela.controls.dia_semana.value !== diaSemana,
        ),
      );
    }
  }

  aplicarAoProximoDia(diaSemana: number): void {
    const proximoDia = (diaSemana + 1) % DIAS_SEMANA.length;
    const janelasOrigem = this.janelasFormulario().filter(
      (janela) => janela.controls.dia_semana.value === diaSemana,
    );
    const janelasCopiadas = janelasOrigem.map((janela) =>
      this.criarJanelaFormulario(
        proximoDia,
        janela.controls.hora_inicio.value,
        janela.controls.hora_fim.value,
      ),
    );

    // A copia substitui o destino para evitar periodos duplicados ou
    // sobrepostos quando a acao for usada mais de uma vez.
    this.janelasFormulario.update((janelas) => [
      ...janelas.filter(
        (janela) => janela.controls.dia_semana.value !== proximoDia,
      ),
      ...janelasCopiadas,
    ]);
    this.erroFormulario.set(null);
    this.mensagemSucesso.set(null);
  }

  async salvarDisponibilidade(): Promise<void> {
    const profissionalId = this.profissionalSelecionadoId();

    if (!profissionalId || this.salvando()) {
      return;
    }

    this.erroFormulario.set(null);
    this.mensagemSucesso.set(null);
    this.janelasFormulario().forEach((janela) => janela.markAllAsTouched());

    // O schema compartilhado garante as mesmas regras de horario e
    // sobreposicao usadas pelo backend.
    const resultado = atualizarDisponibilidadeSemanalSchema.safeParse({
      janelas: this.janelasFormulario().map((janela) => janela.getRawValue()),
    });

    if (!resultado.success) {
      this.erroFormulario.set(
        resultado.error.issues[0]?.message ?? 'Revise os horarios informados.',
      );
      return;
    }

    this.salvando.set(true);

    try {
      const disponibilidade =
        await this.disponibilidadeService.updateEntidade(
          profissionalId,
          resultado.data,
        );

      this.preencherFormulario(disponibilidade);
      this.mensagemSucesso.set('Disponibilidade salva com sucesso.');
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroFormulario.set(error.message);
    } finally {
      this.salvando.set(false);
    }
  }

  async cancelarAlteracoes(): Promise<void> {
    const profissionalId = this.profissionalSelecionadoId();

    if (!profissionalId || this.carregando() || this.salvando()) {
      return;
    }

    this.erroFormulario.set(null);
    this.mensagemSucesso.set(null);
    await this.carregarDisponibilidade(profissionalId);
  }

  async carregarPagina(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const profissionais = await this.disponibilidadeService.getLista();

      // Profissionais inativos continuam na resposta, mas nao devem ser
      // selecionados automaticamente para configurar novos horarios.
      const primeiroProfissionalAtivo = profissionais.find(
        (profissional) => profissional.ativo,
      );

      if (primeiroProfissionalAtivo) {
        this.profissionalSelecionadoId.set(primeiroProfissionalAtivo.id);
        const disponibilidade = await this.disponibilidadeService.getEntidade(
          primeiroProfissionalAtivo.id,
        );
        this.preencherFormulario(disponibilidade);
      }
    } catch (error) {
      this.tratarErro(error);
    } finally {
      this.carregando.set(false);
    }
  }

  private async carregarDisponibilidade(
    profissionalId: string,
  ): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const disponibilidade =
        await this.disponibilidadeService.getEntidade(profissionalId);
      this.preencherFormulario(disponibilidade);
    } catch (error) {
      this.tratarErro(error);
    } finally {
      this.carregando.set(false);
    }
  }

  private tratarErro(error: unknown): void {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    this.erro.set(error.message);
  }

  private preencherFormulario(
    disponibilidade: DisponibilidadeSemanalResponseDto,
  ): void {
    this.janelasFormulario.set(
      disponibilidade.janelas.map(
        (janela): JanelaSemanalFormulario =>
          this.criarJanelaFormulario(
            janela.dia_semana,
            janela.hora_inicio,
            janela.hora_fim,
          ),
      ),
    );
  }

  private criarJanelaFormulario(
    diaSemana: number,
    horaInicio: string,
    horaFim: string,
  ): JanelaSemanalFormulario {
    return new FormGroup({
      dia_semana: new FormControl(diaSemana, { nonNullable: true }),
      hora_inicio: new FormControl(horaInicio, { nonNullable: true }),
      hora_fim: new FormControl(horaFim, { nonNullable: true }),
    });
  }
}
