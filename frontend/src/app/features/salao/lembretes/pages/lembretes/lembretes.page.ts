import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ORIGEM_LEMBRETE,
  PERIODO_LEMBRETE,
  type LembreteResponseDto,
} from '@fluy/schema';
import {
  AlertController,
  InfiniteScrollCustomEvent,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import type {
  EstadoPaginaLembretes,
  FiltrosListaLembretes,
} from '@app/features/salao/lembretes/contracts';
import {
  FILTROS_PADRAO_LISTA_LEMBRETES,
  ROTULO_ORIGEM_LEMBRETE,
  ROTULO_PERIODO_LEMBRETE,
} from '@app/features/salao/lembretes/lembretes-data';
import { LembretesService } from '@app/features/salao/lembretes/services/lembretes.service';
import { FormularioLembreteComponent } from '@app/features/salao/lembretes/components/formulario-lembrete/formulario-lembrete.component';
import { ItemLembreteComponent } from '@app/features/salao/lembretes/components/item-lembrete/item-lembrete.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { extrairDataCivil } from '@app/shared/utils/data-civil';

@Component({
  selector: 'app-lembretes',
  templateUrl: './lembretes.page.html',
  styleUrls: ['./lembretes.page.scss'],
  standalone: true,
  imports: [
    FormularioLembreteComponent,
    HeaderComponent,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    ItemLembreteComponent,
  ],
})
export class LembretesPage implements OnInit {
  private readonly lembretesService = inject(LembretesService);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  readonly periodos = PERIODO_LEMBRETE;
  readonly origens = ORIGEM_LEMBRETE;
  readonly rotuloPeriodo = ROTULO_PERIODO_LEMBRETE;
  readonly rotuloOrigem = ROTULO_ORIGEM_LEMBRETE;

  readonly lembretes = this.lembretesService.lembretes;
  readonly proximoCursor = this.lembretesService.proximoCursor;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);
  readonly filtros = signal<FiltrosListaLembretes>(
    FILTROS_PADRAO_LISTA_LEMBRETES,
  );
  readonly lembreteEmEdicao = signal<LembreteResponseDto | null>(null);
  readonly salvando = signal(false);
  readonly erroFormulario = signal<string | null>(null);

  readonly hoje = computed(() => {
    const fusoHorario = this.lembretesService.fusoHorario();

    return fusoHorario
      ? extrairDataCivil({ instante: new Date().toISOString(), fusoHorario })
      : '';
  });

  readonly estadoPagina = computed<EstadoPaginaLembretes>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.erro()) {
      return 'erro';
    }

    if (this.lembretes().length > 0) {
      return 'lista';
    }

    return this.usaFiltrosPadrao() ? 'vazio' : 'sem-resultados';
  });

  ngOnInit(): void {
    void this.carregar();
  }

  async atualizarPesquisa(valor: string | null | undefined): Promise<void> {
    const busca = valor?.trim() || undefined;

    this.filtros.update((filtros) => ({ ...filtros, busca }));
    await this.carregar();
  }

  // A opção "Todos" chega vazia do select e significa não filtrar.
  async alterarFiltro<Campo extends 'periodo' | 'origem'>({
    campo,
    valor,
  }: {
    campo: Campo;
    valor: FiltrosListaLembretes[Campo] | '';
  }): Promise<void> {
    this.filtros.update((filtros) => ({
      ...filtros,
      [campo]: valor || undefined,
    }));
    await this.carregar();
  }

  async carregarMais(evento: InfiniteScrollCustomEvent): Promise<void> {
    try {
      await this.lembretesService.getProximaPagina();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erro.set(error.message);
    } finally {
      await evento.target.complete();
    }
  }

  abrirFicha(id: string): void {
    void this.router.navigate(['/painel/clientes', id]);
  }

  async concluir(id: string): Promise<void> {
    this.erroAcao.set(null);

    try {
      await this.lembretesService.concluir(id);
    } catch (error) {
      this.tratarErroAcao({
        error,
        mensagemPadrao: 'Não foi possível concluir o lembrete.',
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

    this.erroAcao.set(null);

    try {
      await this.lembretesService.deleteEntidade(lembrete.id);
    } catch (error) {
      this.tratarErroAcao({
        error,
        mensagemPadrao: 'Não foi possível excluir o lembrete.',
      });
    }
  }

  abrirEdicao(lembrete: LembreteResponseDto): void {
    this.erroFormulario.set(null);
    this.lembreteEmEdicao.set(lembrete);
  }

  fecharEdicao(): void {
    if (this.salvando()) {
      return;
    }

    this.lembreteEmEdicao.set(null);
    this.erroFormulario.set(null);
  }

  async salvarEdicao(dados: { texto: string; data_alvo: string }): Promise<void> {
    const lembrete = this.lembreteEmEdicao();

    if (!lembrete) {
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    try {
      await this.lembretesService.updateEntidade({ id: lembrete.id, dados });
      this.lembreteEmEdicao.set(null);
      // A data nova pode tirar o lembrete do período filtrado ou mudar sua
      // posição na ordem: a lista é refeita no servidor.
      void this.carregar();
    } catch (error) {
      this.erroFormulario.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar o lembrete.',
      );
    } finally {
      this.salvando.set(false);
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.lembretesService.getLista(this.filtros());
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erro.set(error.message);
    } finally {
      this.carregando.set(false);
    }
  }

  private usaFiltrosPadrao(): boolean {
    const filtros = this.filtros();

    return !filtros.busca && !filtros.periodo && !filtros.origem;
  }

  private tratarErroAcao({
    error,
    mensagemPadrao,
  }: {
    error: unknown;
    mensagemPadrao: string;
  }): void {
    this.erroAcao.set(
      error instanceof ApiError ? error.message : mensagemPadrao,
    );
  }
}
