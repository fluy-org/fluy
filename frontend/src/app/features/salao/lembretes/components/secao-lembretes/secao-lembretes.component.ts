import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import type { LembreteResponseDto } from '@fluy/schema';
import {
  AlertController,
  IonButton,
  IonModal,
  IonText,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import { FormularioLembreteComponent } from '@app/features/salao/lembretes/components/formulario-lembrete/formulario-lembrete.component';
import { ItemLembreteComponent } from '@app/features/salao/lembretes/components/item-lembrete/item-lembrete.component';
import { LembretesService } from '@app/features/salao/lembretes/services/lembretes.service';
import type { EscopoAnotacao } from '@app/shared/contracts';
import { VerMaisComponent } from '@app/shared/components/ver-mais/ver-mais.component';
import { extrairDataCivil } from '@app/shared/utils/data-civil';

// Bloco embutível (exceção registrada no CLAUDE.md do frontend): a ficha e o
// detalhe do agendamento listam e gerenciam lembretes do mesmo jeito, só com
// escopo diferente.
@Component({
  selector: 'app-secao-lembretes',
  templateUrl: './secao-lembretes.component.html',
  styleUrls: ['./secao-lembretes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormularioLembreteComponent,
    IonButton,
    IonModal,
    IonText,
    ItemLembreteComponent,
    VerMaisComponent,
  ],
})
export class SecaoLembretesComponent {
  private readonly lembretesService = inject(LembretesService);
  private readonly alertController = inject(AlertController);

  readonly clienteId = input.required<string>();
  // Presente no detalhe do agendamento: restringe a lista a ele.
  readonly agendamentoId = input<string | null>(null);
  readonly fusoHorario = input.required<string>();
  readonly somenteLeitura = input(false);

  private readonly escopo = computed<EscopoAnotacao>(() => ({
    clienteId: this.clienteId(),
    agendamentoId: this.agendamentoId(),
  }));
  private readonly lista = computed(() =>
    this.lembretesService.listaDoEscopo(this.escopo()),
  );

  readonly lembretes = computed(() => this.lista().lembretes());
  readonly proximoCursor = computed(() => this.lista().proximoCursor());
  readonly hoje = computed(() =>
    extrairDataCivil({
      instante: new Date().toISOString(),
      fusoHorario: this.fusoHorario(),
    }),
  );

  readonly carregandoMais = signal(false);
  readonly erro = signal<string | null>(null);
  readonly formularioAberto = signal(false);
  // Nulo quando o formulário cria; preenchido quando edita um lembrete.
  readonly lembreteEmEdicao = signal<LembreteResponseDto | null>(null);
  readonly salvando = signal(false);
  readonly erroFormulario = signal<string | null>(null);

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
      await this.lembretesService.getListaDoEscopo({
        escopo: this.escopo(),
        cursor,
      });
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. Os lembretes não foram carregados.',
      });
    } finally {
      this.carregandoMais.set(false);
    }
  }

  async concluir(id: string): Promise<void> {
    this.erro.set(null);

    try {
      await this.lembretesService.concluir(id);
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. O lembrete não foi concluído.',
      });
    }
  }

  async confirmarExclusao(lembrete: LembreteResponseDto): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Excluir lembrete',
      message: 'Deseja excluir este lembrete? Esta ação não pode ser desfeita.',
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
      await this.lembretesService.deleteEntidade(lembrete.id);
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. O lembrete não foi excluído.',
      });
    }
  }

  abrirFormulario(lembrete: LembreteResponseDto | null = null): void {
    this.erroFormulario.set(null);
    this.lembreteEmEdicao.set(lembrete);
    this.formularioAberto.set(true);
  }

  fecharFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formularioAberto.set(false);
    this.lembreteEmEdicao.set(null);
    this.erroFormulario.set(null);
  }

  async salvar(dados: { texto: string; data_alvo: string }): Promise<void> {
    const lembrete = this.lembreteEmEdicao();
    const escopo = this.escopo();

    this.salvando.set(true);
    this.erroFormulario.set(null);

    try {
      if (lembrete) {
        await this.lembretesService.updateEntidade({ id: lembrete.id, dados });
      } else {
        await this.lembretesService.setEntidade({
          cliente_id: escopo.clienteId,
          ...(escopo.agendamentoId
            ? { agendamento_id: escopo.agendamentoId }
            : {}),
          ...dados,
        });
      }

      this.formularioAberto.set(false);
      this.lembreteEmEdicao.set(null);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroFormulario.set(this.mensagemDeErroAoSalvar(error));
    } finally {
      this.salvando.set(false);
    }
  }

  private async carregar(escopo: EscopoAnotacao): Promise<void> {
    this.erro.set(null);

    try {
      await this.lembretesService.getListaDoEscopo({ escopo });
    } catch (error) {
      this.tratarErro({
        error,
        mensagemOffline: 'Sem conexão. Os lembretes não foram carregados.',
      });
    }
  }

  // A tela que embute o bloco nem sempre sabe se a cliente está ativa: o
  // backend recusa criar para cliente inativa com 404.
  private mensagemDeErroAoSalvar(error: ApiError): string {
    if (error.status === 0) {
      return 'Sem conexão. O lembrete não foi salvo.';
    }

    if (error.status === 404 && !this.lembreteEmEdicao()) {
      return 'Reative a cliente para adicionar lembretes.';
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
