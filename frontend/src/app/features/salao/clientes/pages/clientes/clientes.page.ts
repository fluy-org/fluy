import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonButton,
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
import {
  ORDENACAO_CLIENTE,
  SEGMENTO_CLIENTE,
  STATUS_FILTRO_CLIENTE,
  type CriarClienteDto,
} from '@fluy/schema';
import { ApiError } from '@app/core/errors/api-error';
import {
  FILTROS_PADRAO_LISTA_CLIENTES,
  ROTULO_ORDENACAO_CLIENTE,
  ROTULO_SEGMENTO_CLIENTE,
  ROTULO_STATUS_FILTRO_CLIENTE,
} from '@app/features/salao/clientes/clientes-data';
import { FormularioClienteComponent } from '@app/features/salao/clientes/components/formulario-cliente/formulario-cliente.component';
import { ResumoClienteComponent } from '@app/features/salao/clientes/components/resumo-cliente/resumo-cliente.component';
import type {
  EstadoPaginaClientes,
  FiltrosListaClientes,
} from '@app/features/salao/clientes/contracts';
import { ClientesService } from '@app/features/salao/clientes/services/clientes.service';
import { HeaderComponent } from '@app/shared/components/header/header.component';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [
    FormularioClienteComponent,
    HeaderComponent,
    IonButton,
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
    ResumoClienteComponent,
  ],
})
export class ClientesPage implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly router = inject(Router);

  readonly statusFiltro = STATUS_FILTRO_CLIENTE;
  readonly segmentos = SEGMENTO_CLIENTE;
  readonly ordenacoes = ORDENACAO_CLIENTE;
  readonly rotuloStatus = ROTULO_STATUS_FILTRO_CLIENTE;
  readonly rotuloSegmento = ROTULO_SEGMENTO_CLIENTE;
  readonly rotuloOrdenacao = ROTULO_ORDENACAO_CLIENTE;

  readonly clientes = this.clientesService.clientes;
  readonly proximoCursor = this.clientesService.proximoCursor;
  readonly fusoHorario = this.clientesService.fusoHorario;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly filtros = signal<FiltrosListaClientes>(FILTROS_PADRAO_LISTA_CLIENTES);
  readonly formularioAberto = signal(false);
  readonly salvandoCliente = signal(false);
  readonly erroFormulario = signal<string | null>(null);

  readonly estadoPagina = computed<EstadoPaginaClientes>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.erro()) {
      return 'erro';
    }

    if (this.clientes().length > 0) {
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

  async alterarFiltro<Campo extends 'status' | 'segmento' | 'ordenacao'>(
    campo: Campo,
    valor: FiltrosListaClientes[Campo],
  ): Promise<void> {
    this.filtros.update((filtros) => ({ ...filtros, [campo]: valor }));
    await this.carregar();
  }

  async carregarMais(evento: InfiniteScrollCustomEvent): Promise<void> {
    try {
      await this.clientesService.getProximaPagina();
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

  abrirFormulario(): void {
    this.erroFormulario.set(null);
    this.formularioAberto.set(true);
  }

  fecharFormulario(): void {
    if (this.salvandoCliente()) {
      return;
    }

    this.formularioAberto.set(false);
    this.erroFormulario.set(null);
  }

  async salvarCliente(dados: CriarClienteDto): Promise<void> {
    this.salvandoCliente.set(true);
    this.erroFormulario.set(null);

    try {
      await this.clientesService.setEntidade(dados);
      this.formularioAberto.set(false);
      void this.carregar();
    } catch (error) {
      this.erroFormulario.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar o cliente.',
      );
    } finally {
      this.salvandoCliente.set(false);
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.clientesService.getLista(this.filtros());
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

    return (
      !filtros.busca &&
      filtros.status === FILTROS_PADRAO_LISTA_CLIENTES.status &&
      filtros.segmento === FILTROS_PADRAO_LISTA_CLIENTES.segmento
    );
  }
}
