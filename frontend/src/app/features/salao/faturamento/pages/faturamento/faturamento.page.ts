import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import {
  listarFaturamentoQuerySchema,
  type ListarFaturamentoQueryDto,
  type PeriodoFaturamentoDto,
} from '@fluy/schema';
import { distinctUntilChanged, type Subscription } from 'rxjs';
import {
  type InfiniteScrollCustomEvent,
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { AtendimentosRealizadosComponent } from '@app/features/salao/faturamento/components/atendimentos-realizados/atendimentos-realizados.component';
import { SeletorPeriodoComponent } from '@app/features/salao/faturamento/components/seletor-periodo/seletor-periodo.component';
import { ResumoFaturamentoComponent } from '@app/features/salao/faturamento/components/resumo-faturamento/resumo-faturamento.component';
import { RecebimentoPorMetodoComponent } from '@app/features/salao/faturamento/components/recebimento-por-metodo/recebimento-por-metodo.component';
import { SinaisRetidosComponent } from '@app/features/salao/faturamento/components/sinais-retidos/sinais-retidos.component';
import type { SelecaoPeriodoFaturamento } from '@app/features/salao/faturamento/contracts';
import { PERIODO_PADRAO_FATURAMENTO } from '@app/features/salao/faturamento/faturamento-data';
import { FaturamentoService } from '@app/features/salao/faturamento/services/faturamento.service';
import { HeaderComponent } from '@app/shared/components/header/header.component';

@Component({
  selector: 'app-faturamento',
  templateUrl: './faturamento.page.html',
  styleUrls: ['./faturamento.page.scss'],
  standalone: true,
  imports: [
    AtendimentosRealizadosComponent,
    SeletorPeriodoComponent,
    ResumoFaturamentoComponent,
    RecebimentoPorMetodoComponent,
    SinaisRetidosComponent,
    HeaderComponent,
    IonButton,
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    IonText,
  ],
})
export class FaturamentoPage implements OnDestroy {
  private readonly faturamentoService = inject(FaturamentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private consultaUrl?: Subscription;
  readonly faturamento = this.faturamentoService.faturamento;
  readonly atendimentos = this.faturamentoService.atendimentos;
  readonly estadoPagina = this.faturamentoService.estadoPagina;
  readonly proximoCursor = this.faturamentoService.proximoCursor;
  readonly carregando = this.faturamentoService.carregando;
  readonly erro = this.faturamentoService.erro;
  readonly carregandoMais = this.faturamentoService.carregandoMais;
  readonly erroPaginacao = this.faturamentoService.erroPaginacao;
  readonly selecao = signal<SelecaoPeriodoFaturamento>(
    PERIODO_PADRAO_FATURAMENTO,
  );
  readonly intervaloAplicado = signal<PeriodoFaturamentoDto | null>(null);

  ionViewDidEnter(): void {
    if (this.consultaUrl && !this.consultaUrl.closed) return;
    this.consultaUrl = this.route.queryParamMap
      .pipe(
        distinctUntilChanged((anterior, atual) =>
          ['periodo', 'data_inicio', 'data_fim'].every(
            (chave) =>
              JSON.stringify(anterior.getAll(chave)) ===
              JSON.stringify(atual.getAll(chave)),
          ),
        ),
      )
      .subscribe((parametros) => {
        if (!this.estaNaTelaDeFaturamento()) return;

        void this.consultarPeriodoDaUrl(parametros);
      });
  }

  ionViewDidLeave(): void {
    // Query params também disparam o ciclo do Ionic, mantendo a mesma page.
    if (this.estaNaTelaDeFaturamento()) return;
    this.encerrarConsulta();
  }

  ngOnDestroy(): void {
    this.encerrarConsulta();
  }

  selecionarPeriodo(selecao: SelecaoPeriodoFaturamento): void {
    this.selecao.set(selecao);
  }

  async aplicarPeriodo(dados: ListarFaturamentoQueryDto): Promise<void> {
    await this.atualizarUrl({
      dados: listarFaturamentoQuerySchema.parse(dados),
    });
  }

  tentarNovamente(): Promise<void> {
    return this.faturamentoService.tentarNovamente();
  }

  async carregarMais(evento?: InfiniteScrollCustomEvent): Promise<void> {
    try {
      await this.faturamentoService.carregarMaisAtendimentos();
    } finally {
      if (evento) await evento.target.complete();
    }
  }

  private async consultarPeriodoDaUrl(parametros: ParamMap): Promise<void> {
    const dados = Object.fromEntries(
      ['periodo', 'data_inicio', 'data_fim']
        .filter((chave) => parametros.has(chave))
        .map((chave) => {
          const valores = parametros.getAll(chave);
          return [chave, valores.length === 1 ? valores[0] : valores];
        }),
    );
    const resultado = listarFaturamentoQuerySchema.safeParse(dados);

    if (!resultado.success) {
      await this.atualizarUrl({
        dados: { periodo: PERIODO_PADRAO_FATURAMENTO },
        substituir: true,
      });
      return;
    }

    const periodo = resultado.data;
    this.selecao.set(periodo.periodo ?? 'customizado');
    this.intervaloAplicado.set(
      periodo.data_inicio && periodo.data_fim
        ? { data_inicio: periodo.data_inicio, data_fim: periodo.data_fim }
        : null,
    );
    await this.faturamentoService.consultarPeriodo(periodo);
  }

  private atualizarUrl({
    dados,
    substituir = false,
  }: {
    dados: ListarFaturamentoQueryDto;
    substituir?: boolean;
  }): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        periodo: dados.periodo ?? null,
        data_inicio: dados.data_inicio ?? null,
        data_fim: dados.data_fim ?? null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: substituir,
    });
  }

  private encerrarConsulta(): void {
    this.consultaUrl?.unsubscribe();
    this.consultaUrl = undefined;
    this.faturamentoService.encerrarConsulta();
  }

  private estaNaTelaDeFaturamento(): boolean {
    return this.router.isActive('/painel/faturamento', {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }
}
