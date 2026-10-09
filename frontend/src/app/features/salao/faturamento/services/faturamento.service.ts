import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  FaturamentoResponseDto,
  ListaAtendimentosFaturamentoResponseDto,
  ListarAtendimentosFaturamentoQueryDto,
  ListarFaturamentoQueryDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@app/core/errors/api-error';
import type { EstadoPaginaFaturamento } from '@app/features/salao/faturamento/contracts';
import { PERIODO_PADRAO_FATURAMENTO } from '@app/features/salao/faturamento/faturamento-data';

@Injectable({ providedIn: 'root' })
export class FaturamentoService {
  private readonly http = inject(HttpClient);
  private readonly _faturamento = signal<FaturamentoResponseDto | null>(null);
  private readonly _paginaAtendimentos =
    signal<ListaAtendimentosFaturamentoResponseDto | null>(null);
  private readonly _carregando = signal(true);
  private readonly _erro = signal<string | null>(null);
  private readonly _carregandoMais = signal(false);
  private readonly _erroPaginacao = signal<string | null>(null);
  private consultaAtual = 0;
  private dadosConsulta: ListarFaturamentoQueryDto = {
    periodo: PERIODO_PADRAO_FATURAMENTO,
  };

  readonly faturamento = this._faturamento.asReadonly();
  readonly atendimentos = computed(
    () => this._paginaAtendimentos()?.itens ?? [],
  );
  readonly proximoCursor = computed(
    () => this._paginaAtendimentos()?.proximo_cursor ?? null,
  );
  readonly carregando = this._carregando.asReadonly();
  readonly erro = this._erro.asReadonly();
  readonly carregandoMais = this._carregandoMais.asReadonly();
  readonly erroPaginacao = this._erroPaginacao.asReadonly();

  readonly estadoPagina = computed<EstadoPaginaFaturamento>(() => {
    if (this._carregando()) return 'carregando';
    if (this._erro()) return 'erro';

    const faturamento = this._faturamento();
    return !faturamento ||
      (faturamento.resumo.total_concluidos === 0 &&
        faturamento.sinais_retidos.length === 0)
      ? 'vazio'
      : 'relatorio';
  });

  async consultarPeriodo(dados: ListarFaturamentoQueryDto): Promise<void> {
    const consulta = ++this.consultaAtual;
    this.dadosConsulta = { ...dados };
    this.limparConsulta();

    try {
      const faturamento = await firstValueFrom(
        this.http.get<FaturamentoResponseDto>('/faturamento', {
          params: this.montarParametros(dados),
        }),
      );

      if (consulta !== this.consultaAtual) return;

      // As datas resolvidas mantêm as duas consultas no mesmo período,
      // inclusive se um preset atravessar a virada de semana ou mês.
      const pagina = await this.consultarAtendimentos(faturamento.periodo);

      if (consulta !== this.consultaAtual) return;

      this._paginaAtendimentos.set(pagina);
      this._faturamento.set(faturamento);
    } catch (error) {
      if (consulta !== this.consultaAtual) return;
      if (!(error instanceof ApiError)) throw error;
      this._erro.set(error.message);
    } finally {
      if (consulta === this.consultaAtual) this._carregando.set(false);
    }
  }

  tentarNovamente(): Promise<void> {
    return this.consultarPeriodo(this.dadosConsulta);
  }

  async carregarMaisAtendimentos(): Promise<void> {
    const cursor = this.proximoCursor();
    const periodo = this._faturamento()?.periodo;

    if (!cursor || !periodo || this._carregandoMais() || this._carregando()) {
      return;
    }

    const consulta = this.consultaAtual;
    this._carregandoMais.set(true);
    this._erroPaginacao.set(null);

    try {
      const pagina = await this.consultarAtendimentos({ ...periodo, cursor });

      if (consulta !== this.consultaAtual) return;

      this._paginaAtendimentos.update((anterior) => {
        if (!anterior) return anterior;

        const ids = new Set(anterior.itens.map((item) => item.agendamento_id));
        const novos = pagina.itens.filter((item) => {
          if (ids.has(item.agendamento_id)) return false;
          ids.add(item.agendamento_id);
          return true;
        });
        return { ...pagina, itens: [...anterior.itens, ...novos] };
      });
    } catch (error) {
      if (consulta !== this.consultaAtual) return;
      if (!(error instanceof ApiError)) throw error;
      this._erroPaginacao.set(error.message);
    } finally {
      if (consulta === this.consultaAtual) this._carregandoMais.set(false);
    }
  }

  encerrarConsulta(): void {
    ++this.consultaAtual;
    this.limparConsulta();
  }

  private limparConsulta(): void {
    this._faturamento.set(null);
    this._paginaAtendimentos.set(null);
    this._erro.set(null);
    this._erroPaginacao.set(null);
    this._carregandoMais.set(false);
    this._carregando.set(true);
  }

  private consultarAtendimentos(
    dados: ListarAtendimentosFaturamentoQueryDto,
  ): Promise<ListaAtendimentosFaturamentoResponseDto> {
    return firstValueFrom(
      this.http.get<ListaAtendimentosFaturamentoResponseDto>(
        '/faturamento/atendimentos',
        { params: this.montarParametros(dados) },
      ),
    );
  }

  private montarParametros(
    dados: ListarAtendimentosFaturamentoQueryDto,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(dados).filter(
        (entrada): entrada is [string, string] =>
          typeof entrada[1] === 'string',
      ),
    );
  }
}
