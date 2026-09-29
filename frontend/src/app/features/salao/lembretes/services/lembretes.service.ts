import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, type Signal } from '@angular/core';
import type {
  AtualizarLembreteDto,
  CriarLembreteDto,
  FusoHorarioBrasil,
  LembreteResponseDto,
  ListaLembretesResponseDto,
  ListarLembreteQueryDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';
import type {
  FiltrosListaLembretes,
  ListaLembretesDoEscopo,
} from '@app/features/salao/lembretes/contracts';
import { FILTROS_PADRAO_LISTA_LEMBRETES } from '@app/features/salao/lembretes/lembretes-data';
import type { EscopoAnotacao } from '@app/shared/contracts';
import { acumularPagina, chaveDoEscopo } from '@app/shared/utils/paginacao';

@Injectable({ providedIn: 'root' })
export class LembretesService {
  private readonly http = inject(HttpClient);
  private readonly _lembretes = signal<LembreteResponseDto[]>([]);
  private readonly _proximoCursor = signal<string | null>(null);
  private readonly _fusoHorario = signal<FusoHorarioBrasil | null>(null);
  // A aba tem a lista acima; ficha e detalhes de agendamento têm uma por
  // escopo, para telas vivas juntas na pilha do Ionic não se sobrescreverem.
  private readonly listas = new Map<string, ListaLembretesDoEscopo>();
  private filtrosConsulta: FiltrosListaLembretes =
    FILTROS_PADRAO_LISTA_LEMBRETES;
  private consultaAtual = 0;

  readonly lembretes = this._lembretes.asReadonly();
  readonly proximoCursor = this._proximoCursor.asReadonly();
  readonly fusoHorario = this._fusoHorario.asReadonly();

  async getLista(
    filtros: FiltrosListaLembretes = FILTROS_PADRAO_LISTA_LEMBRETES,
  ): Promise<LembreteResponseDto[]> {
    // A busca dispara uma consulta por digitação; só a mais recente pode
    // sobrescrever a lista, mesmo que uma anterior responda depois.
    const consulta = ++this.consultaAtual;
    const pagina = await this.getPagina(filtros);

    if (consulta !== this.consultaAtual) {
      return this._lembretes();
    }

    this.filtrosConsulta = filtros;
    this._lembretes.set(pagina.itens);
    this._proximoCursor.set(pagina.proximo_cursor);
    this._fusoHorario.set(pagina.fuso_horario);
    return pagina.itens;
  }

  async getProximaPagina(): Promise<void> {
    const cursor = this._proximoCursor();

    if (!cursor) {
      return;
    }

    const consulta = this.consultaAtual;
    const pagina = await this.getPagina({ ...this.filtrosConsulta, cursor });

    if (consulta !== this.consultaAtual) {
      return;
    }

    this._lembretes.update((lembretes) =>
      acumularPagina({ itens: lembretes, novos: pagina.itens }),
    );
    this._proximoCursor.set(pagina.proximo_cursor);
  }

  listaDoEscopo(escopo: EscopoAnotacao): {
    lembretes: Signal<LembreteResponseDto[]>;
    proximoCursor: Signal<string | null>;
  } {
    const lista = this.obterLista(escopo);

    return {
      lembretes: lista.lembretes.asReadonly(),
      proximoCursor: lista.proximoCursor.asReadonly(),
    };
  }

  async getListaDoEscopo({
    escopo,
    cursor,
  }: {
    escopo: EscopoAnotacao;
    cursor?: string;
  }): Promise<void> {
    const lista = this.obterLista(escopo);

    if (!cursor) {
      lista.lembretes.set([]);
      lista.proximoCursor.set(null);
    }

    const pagina = await this.getPagina({
      ...(escopo.agendamentoId
        ? { agendamento_id: escopo.agendamentoId }
        : { cliente_id: escopo.clienteId }),
      cursor,
    });

    lista.lembretes.update((lembretes) =>
      acumularPagina({ itens: lembretes, novos: pagina.itens }),
    );
    lista.proximoCursor.set(pagina.proximo_cursor);
  }

  // As listas são ordenadas pela data alvo e filtradas no servidor: anexar o
  // lembrete criado localmente o colocaria fora de ordem ou fora do filtro.
  // As listas já abertas da cliente e do agendamento são refeitas; a aba
  // recarrega ao abrir.
  async setEntidade(dados: CriarLembreteDto): Promise<LembreteResponseDto> {
    const lembreteCriado = await firstValueFrom(
      this.http.post<LembreteResponseDto>('/lembretes', dados),
    );

    await this.recarregarListas({
      clienteId: lembreteCriado.cliente.id,
      agendamentoId: lembreteCriado.agendamento_id,
    });
    return lembreteCriado;
  }

  // Também usado depois de concluir um atendimento, que pode gerar o lembrete
  // automático no backend. Falha ao recarregar não desfaz o que já foi gravado:
  // a lista só fica desatualizada até a tela recarregar.
  async recarregarListas({
    clienteId,
    agendamentoId,
  }: EscopoAnotacao): Promise<void> {
    const escopos: EscopoAnotacao[] = [
      { clienteId, agendamentoId: null },
      ...(agendamentoId ? [{ clienteId, agendamentoId }] : []),
    ];

    await Promise.allSettled(
      escopos
        .filter((escopo) => this.listas.has(chaveDoEscopo(escopo)))
        .map((escopo) => this.getListaDoEscopo({ escopo })),
    );
  }

  async updateEntidade({
    id,
    dados,
  }: {
    id: string;
    dados: AtualizarLembreteDto;
  }): Promise<LembreteResponseDto> {
    const lembreteAtualizado = await firstValueFrom(
      this.http.put<LembreteResponseDto>(`/lembretes/${id}`, dados),
    );

    this.atualizarTodasAsListas((lembretes) =>
      lembretes.map((item) =>
        item.id === lembreteAtualizado.id ? lembreteAtualizado : item,
      ),
    );
    return lembreteAtualizado;
  }

  // Concluído sai da lista ativa em todas as telas.
  async concluir(id: string): Promise<LembreteResponseDto> {
    const lembreteConcluido = await firstValueFrom(
      this.http.patch<LembreteResponseDto>(`/lembretes/${id}/concluir`, {}),
    );

    this.atualizarTodasAsListas((lembretes) =>
      lembretes.filter((item) => item.id !== id),
    );
    return lembreteConcluido;
  }

  async deleteEntidade(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/lembretes/${id}`));

    this.atualizarTodasAsListas((lembretes) =>
      lembretes.filter((item) => item.id !== id),
    );
  }

  private getPagina(
    query: ListarLembreteQueryDto,
  ): Promise<ListaLembretesResponseDto> {
    return firstValueFrom(
      this.http.get<ListaLembretesResponseDto>('/lembretes', {
        params: montarParams(query),
      }),
    );
  }

  private obterLista(escopo: EscopoAnotacao): ListaLembretesDoEscopo {
    const chave = chaveDoEscopo(escopo);
    const existente = this.listas.get(chave);

    if (existente) {
      return existente;
    }

    const lista: ListaLembretesDoEscopo = {
      lembretes: signal<LembreteResponseDto[]>([]),
      proximoCursor: signal<string | null>(null),
    };

    this.listas.set(chave, lista);
    return lista;
  }

  private atualizarTodasAsListas(
    atualizar: (lembretes: LembreteResponseDto[]) => LembreteResponseDto[],
  ): void {
    this._lembretes.update(atualizar);

    for (const lista of this.listas.values()) {
      lista.lembretes.update(atualizar);
    }
  }
}

function montarParams(
  query: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entrada): entrada is [string, string] => !!entrada[1],
    ),
  );
}
