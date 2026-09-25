import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AgendamentoClienteResponseDto,
  AtualizarClienteDto,
  ClienteFichaResponseDto,
  ClienteListaItemResponseDto,
  ClienteResponseDto,
  CriarClienteDto,
  FusoHorarioBrasil,
  ListaAgendamentosClienteResponseDto,
  ListaClientesResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';
import { FILTROS_PADRAO_LISTA_CLIENTES } from '@app/features/salao/clientes/clientes-data';
import type { FiltrosListaClientes } from '@app/features/salao/clientes/contracts';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly _clientes = signal<ClienteListaItemResponseDto[]>([]);
  private readonly _proximoCursor = signal<string | null>(null);
  private readonly _fusoHorario = signal<FusoHorarioBrasil | null>(null);
  private readonly _ficha = signal<ClienteFichaResponseDto | null>(null);
  private readonly _agendamentos = signal<AgendamentoClienteResponseDto[]>([]);
  private readonly _proximoCursorAgendamentos = signal<string | null>(null);
  private filtrosConsulta: FiltrosListaClientes = FILTROS_PADRAO_LISTA_CLIENTES;
  private consultaAtual = 0;

  readonly clientes = this._clientes.asReadonly();
  readonly proximoCursor = this._proximoCursor.asReadonly();
  readonly fusoHorario = this._fusoHorario.asReadonly();
  readonly ficha = this._ficha.asReadonly();
  readonly agendamentos = this._agendamentos.asReadonly();
  readonly proximoCursorAgendamentos =
    this._proximoCursorAgendamentos.asReadonly();

  async getLista(
    filtros: FiltrosListaClientes = FILTROS_PADRAO_LISTA_CLIENTES,
  ): Promise<ClienteListaItemResponseDto[]> {
    // A busca dispara uma consulta por digitação; só a mais recente pode
    // sobrescrever a lista, mesmo que uma anterior responda depois.
    const consulta = ++this.consultaAtual;
    const pagina = await this.getPagina(filtros);

    if (consulta !== this.consultaAtual) {
      return this._clientes();
    }

    this.filtrosConsulta = filtros;
    this._clientes.set(pagina.itens);
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
    const pagina = await this.getPagina(this.filtrosConsulta, cursor);

    if (consulta !== this.consultaAtual) {
      return;
    }

    // Offset pode repetir item se a lista mudou entre as páginas.
    this._clientes.update((clientes) => {
      const idsCarregados = new Set(clientes.map((cliente) => cliente.id));

      return [
        ...clientes,
        ...pagina.itens.filter((cliente) => !idsCarregados.has(cliente.id)),
      ];
    });
    this._proximoCursor.set(pagina.proximo_cursor);
  }

  async getEntidade(id: string): Promise<ClienteFichaResponseDto> {
    // Limpa antes de buscar para a ficha de outra cliente não aparecer
    // enquanto a nova carrega.
    this._ficha.set(null);

    const ficha = await this.getFicha(id);

    this._ficha.set(ficha);
    return ficha;
  }

  // Leituras sem estado: a tela de agendamento manual consulta clientes sem
  // sobrescrever a lista e a ficha, que continuam em cache na pilha do Ionic.
  getFicha(id: string): Promise<ClienteFichaResponseDto> {
    return firstValueFrom(
      this.http.get<ClienteFichaResponseDto>(`/clientes/${id}`),
    );
  }

  getPagina(
    filtros: FiltrosListaClientes,
    cursor?: string,
  ): Promise<ListaClientesResponseDto> {
    return firstValueFrom(
      this.http.get<ListaClientesResponseDto>('/clientes', {
        params: {
          status: filtros.status,
          segmento: filtros.segmento,
          ordenacao: filtros.ordenacao,
          ...(filtros.busca ? { busca: filtros.busca } : {}),
          ...(cursor ? { cursor } : {}),
        },
      }),
    );
  }

  async getAgendamentos(id: string, cursor?: string): Promise<void> {
    if (!cursor) {
      this._agendamentos.set([]);
      this._proximoCursorAgendamentos.set(null);
    }

    const pagina = await firstValueFrom(
      this.http.get<ListaAgendamentosClienteResponseDto>(
        `/clientes/${id}/agendamentos`,
        { params: cursor ? { cursor } : {} },
      ),
    );

    // Offset pode repetir item se o histórico mudou entre as páginas.
    this._agendamentos.update((agendamentos) => {
      const idsCarregados = new Set(
        agendamentos.map((agendamento) => agendamento.id),
      );

      return [
        ...agendamentos,
        ...pagina.itens.filter(
          (agendamento) => !idsCarregados.has(agendamento.id),
        ),
      ];
    });
    this._proximoCursorAgendamentos.set(pagina.proximo_cursor);
  }

  // A lista é filtrada, buscada e ordenada no servidor: anexar a cliente criada
  // localmente a colocaria fora de ordem ou em segmento a que não pertence.
  // Quem exibe a lista refaz a consulta.
  setEntidade(dados: CriarClienteDto): Promise<ClienteResponseDto> {
    return firstValueFrom(
      this.http.post<ClienteResponseDto>('/clientes', dados),
    );
  }

  async updateEntidade(id: string, dados: AtualizarClienteDto): Promise<ClienteResponseDto> {
    const clienteAtualizado = await firstValueFrom(this.http.put<ClienteResponseDto>(`/clientes/${id}`, dados));

    this._clientes.update((clientes) => clientes.map((cliente) => cliente.id === clienteAtualizado.id ? { ...cliente, ...clienteAtualizado } : cliente));
    this.atualizarFicha(clienteAtualizado);

    return clienteAtualizado;
  }

  async inativarEntidade(id: string): Promise<ClienteResponseDto> {
    const clienteInativado = await firstValueFrom(
      this.http.patch<ClienteResponseDto>(`/clientes/${id}/inativar`, {}),
    );

    this._clientes.update((clientes) =>
      this.filtrosConsulta.status === 'ativos'
        ? clientes.filter((cliente) => cliente.id !== clienteInativado.id)
        : clientes.map((cliente) =>
            cliente.id === clienteInativado.id
              ? { ...cliente, ...clienteInativado }
              : cliente,
          ),
    );

    this.atualizarFicha(clienteInativado);
    return clienteInativado;
  }

  async reativarEntidade(id: string): Promise<ClienteResponseDto> {
    const clienteReativado = await firstValueFrom(
      this.http.patch<ClienteResponseDto>(`/clientes/${id}/reativar`, {}),
    );

    this._clientes.update((clientes) =>
      this.filtrosConsulta.status === 'inativos'
        ? clientes.filter((cliente) => cliente.id !== clienteReativado.id)
        : clientes.map((cliente) =>
            cliente.id === clienteReativado.id
              ? { ...cliente, ...clienteReativado }
              : cliente,
          ),
    );

    this.atualizarFicha(clienteReativado);
    return clienteReativado;
  }

  async deleteEntidade(id: string): Promise<void> {
    await this.inativarEntidade(id);
  }

  private atualizarFicha(cliente: ClienteResponseDto): void {
    this._ficha.update((ficha) =>
      ficha?.id === cliente.id ? { ...ficha, ...cliente } : ficha,
    );
  }
}
