import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, type Signal } from '@angular/core';
import type {
  AtualizarNotaDto,
  CriarNotaDto,
  ListaNotasResponseDto,
  NotaResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';
import type { ListaNotasDoEscopo } from '@app/features/salao/notas/contracts';
import type { EscopoAnotacao } from '@app/shared/contracts';
import { acumularPagina, chaveDoEscopo } from '@app/shared/utils/paginacao';

@Injectable({ providedIn: 'root' })
export class NotasService {
  private readonly http = inject(HttpClient);
  private readonly listas = new Map<string, ListaNotasDoEscopo>();

  listaDoEscopo(escopo: EscopoAnotacao): {
    notas: Signal<NotaResponseDto[]>;
    proximoCursor: Signal<string | null>;
  } {
    const lista = this.obterLista(escopo);

    return {
      notas: lista.notas.asReadonly(),
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
      lista.notas.set([]);
      lista.proximoCursor.set(null);
    }

    const pagina = await firstValueFrom(
      this.http.get<ListaNotasResponseDto>('/notas', {
        params: {
          ...(escopo.agendamentoId
            ? { agendamento_id: escopo.agendamentoId }
            : { cliente_id: escopo.clienteId }),
          ...(cursor ? { cursor } : {}),
        },
      }),
    );

    lista.notas.update((notas) =>
      acumularPagina({ itens: notas, novos: pagina.itens }),
    );
    lista.proximoCursor.set(pagina.proximo_cursor);
  }

  // As listas são da mais recente para a mais antiga: a nota criada entra no
  // topo da lista da cliente e, quando vinculada, na do agendamento.
  async setEntidade(dados: CriarNotaDto): Promise<NotaResponseDto> {
    const notaCriada = await firstValueFrom(
      this.http.post<NotaResponseDto>('/notas', dados),
    );
    const escopos: EscopoAnotacao[] = [
      { clienteId: notaCriada.cliente_id, agendamentoId: null },
      ...(notaCriada.agendamento_id
        ? [
            {
              clienteId: notaCriada.cliente_id,
              agendamentoId: notaCriada.agendamento_id,
            },
          ]
        : []),
    ];

    for (const escopo of escopos) {
      this.listas
        .get(chaveDoEscopo(escopo))
        ?.notas.update((notas) => [notaCriada, ...notas]);
    }

    return notaCriada;
  }

  async updateEntidade({
    id,
    dados,
  }: {
    id: string;
    dados: AtualizarNotaDto;
  }): Promise<NotaResponseDto> {
    const notaAtualizada = await firstValueFrom(
      this.http.put<NotaResponseDto>(`/notas/${id}`, dados),
    );

    this.atualizarTodasAsListas((notas) =>
      notas.map((nota) => (nota.id === notaAtualizada.id ? notaAtualizada : nota)),
    );
    return notaAtualizada;
  }

  async deleteEntidade(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/notas/${id}`));

    this.atualizarTodasAsListas((notas) =>
      notas.filter((nota) => nota.id !== id),
    );
  }

  // A mesma nota pode estar na lista da cliente e na do agendamento.
  private atualizarTodasAsListas(
    atualizar: (notas: NotaResponseDto[]) => NotaResponseDto[],
  ): void {
    for (const lista of this.listas.values()) {
      lista.notas.update(atualizar);
    }
  }

  private obterLista(escopo: EscopoAnotacao): ListaNotasDoEscopo {
    const chave = chaveDoEscopo(escopo);
    const existente = this.listas.get(chave);

    if (existente) {
      return existente;
    }

    const lista: ListaNotasDoEscopo = {
      notas: signal<NotaResponseDto[]>([]),
      proximoCursor: signal<string | null>(null),
    };

    this.listas.set(chave, lista);
    return lista;
  }
}
