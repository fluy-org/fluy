import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { NotaResponseDto } from '@fluy/schema';
import { textoNotaSchema } from '@fluy/schema';
import {
  AlertController,
  IonButton,
  IonText,
  IonTextarea,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import { NotasService } from '@app/features/salao/notas/services/notas.service';
import type { EscopoAnotacao } from '@app/shared/contracts';
import { VerMaisComponent } from '@app/shared/components/ver-mais/ver-mais.component';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { zodValidator } from '@app/shared/utils/zod-validator';

// Bloco embutível (exceção registrada no CLAUDE.md do frontend): a ficha e o
// detalhe do agendamento listam e gerenciam notas do mesmo jeito, só com
// escopo diferente.
@Component({
  selector: 'app-secao-notas',
  templateUrl: './secao-notas.component.html',
  styleUrls: ['./secao-notas.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HoraSalaoPipe,
    IonButton,
    IonText,
    IonTextarea,
    ReactiveFormsModule,
    VerMaisComponent,
  ],
})
export class SecaoNotasComponent {
  private readonly notasService = inject(NotasService);
  private readonly alertController = inject(AlertController);

  readonly clienteId = input.required<string>();
  // Presente no detalhe do agendamento: restringe a lista a ele e vincula o
  // que for criado.
  readonly agendamentoId = input<string | null>(null);
  readonly fusoHorario = input.required<string>();
  readonly somenteLeitura = input(false);

  // Avisa se o escopo ainda tem notas depois de criar ou excluir, para o
  // detalhe refletir no indicador de observações do card.
  readonly notasAlteradas = output<boolean>();

  private readonly escopo = computed<EscopoAnotacao>(() => ({
    clienteId: this.clienteId(),
    agendamentoId: this.agendamentoId(),
  }));
  private readonly lista = computed(() =>
    this.notasService.listaDoEscopo(this.escopo()),
  );

  readonly notas = computed(() => this.lista().notas());
  readonly proximoCursor = computed(() => this.lista().proximoCursor());

  readonly carregandoMais = signal(false);
  readonly erro = signal<string | null>(null);
  readonly salvando = signal(false);
  readonly erroFormulario = signal<string | null>(null);
  readonly texto = new FormControl('', {
    nonNullable: true,
    validators: zodValidator(textoNotaSchema),
  });

  readonly notaEmEdicaoId = signal<string | null>(null);
  readonly salvandoEdicao = signal(false);
  readonly erroEdicao = signal<string | null>(null);
  readonly textoEdicao = new FormControl('', {
    nonNullable: true,
    validators: zodValidator(textoNotaSchema),
  });

  constructor() {
    effect(() => {
      const escopo = this.escopo();

      untracked(() => void this.carregar(escopo));
    });
  }

  async verMais(): Promise<void> {
    const cursor = this.proximoCursor();

    if (!cursor) {
      return;
    }

    this.carregandoMais.set(true);

    try {
      await this.notasService.getListaDoEscopo({
        escopo: this.escopo(),
        cursor,
      });
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. As notas não foram carregadas.',
      });
    } finally {
      this.carregandoMais.set(false);
    }
  }

  async salvar(): Promise<void> {
    if (this.salvando()) {
      return;
    }

    this.erroFormulario.set(null);

    const texto = textoNotaSchema.safeParse(this.texto.value);

    if (!texto.success) {
      this.erroFormulario.set(
        texto.error.issues[0]?.message ?? 'Revise o texto informado.',
      );
      return;
    }

    const { clienteId, agendamentoId } = this.escopo();

    this.salvando.set(true);

    try {
      await this.notasService.setEntidade({
        cliente_id: clienteId,
        ...(agendamentoId ? { agendamento_id: agendamentoId } : {}),
        texto: texto.data,
      });
      this.texto.reset();
      this.notasAlteradas.emit(true);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroFormulario.set(this.mensagemDeErroAoSalvar(error));
    } finally {
      this.salvando.set(false);
    }
  }

  editar(nota: NotaResponseDto): void {
    this.erroEdicao.set(null);
    this.textoEdicao.reset(nota.texto);
    this.notaEmEdicaoId.set(nota.id);
  }

  cancelarEdicao(): void {
    if (this.salvandoEdicao()) {
      return;
    }

    this.notaEmEdicaoId.set(null);
    this.erroEdicao.set(null);
  }

  async salvarEdicao(): Promise<void> {
    const id = this.notaEmEdicaoId();

    if (!id || this.salvandoEdicao()) {
      return;
    }

    this.erroEdicao.set(null);

    const texto = textoNotaSchema.safeParse(this.textoEdicao.value);

    if (!texto.success) {
      this.erroEdicao.set(
        texto.error.issues[0]?.message ?? 'Revise o texto informado.',
      );
      return;
    }

    this.salvandoEdicao.set(true);

    try {
      await this.notasService.updateEntidade({
        id,
        dados: { texto: texto.data },
      });
      this.notaEmEdicaoId.set(null);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroEdicao.set(
        error.status === 0 ? 'Sem conexão. A nota não foi salva.' : error.message,
      );
    } finally {
      this.salvandoEdicao.set(false);
    }
  }

  async confirmarExclusao(nota: NotaResponseDto): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Excluir nota',
      message: 'Deseja excluir esta nota? Esta ação não pode ser desfeita.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'confirm' },
      ],
    });

    await alerta.present();
    const resultado = await alerta.onDidDismiss();

    if (resultado.role !== 'confirm') {
      return;
    }

    this.erro.set(null);

    try {
      await this.notasService.deleteEntidade(nota.id);
      this.notasAlteradas.emit(
        this.notas().length > 0 || this.proximoCursor() !== null,
      );
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. A nota não foi excluída.',
      });
    }
  }

  private async carregar(escopo: EscopoAnotacao): Promise<void> {
    this.erro.set(null);

    try {
      await this.notasService.getListaDoEscopo({ escopo });
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. As notas não foram carregadas.',
      });
    }
  }

  // A tela que embute o bloco nem sempre sabe se a cliente está ativa: o
  // backend recusa criar para cliente inativa com 404.
  private mensagemDeErroAoSalvar(error: ApiError): string {
    if (error.status === 0) {
      return 'Sem conexão. A nota não foi salva.';
    }

    if (error.status === 404) {
      return 'Reative a cliente para adicionar notas.';
    }

    return error.message;
  }

  private tratarErro({
    error,
    mensagemOffline,
  }: {
    error: unknown;
    mensagemOffline: string;
  }): void {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    this.erro.set(error.status === 0 ? mensagemOffline : error.message);
  }
}
