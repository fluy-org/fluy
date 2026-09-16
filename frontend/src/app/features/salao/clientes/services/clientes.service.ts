import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AtualizarClienteDto,
  ClienteResponseDto,
  CriarClienteDto,
  StatusFiltroCliente,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly _clientes = signal<ClienteResponseDto[]>([]);
  private statusConsulta: StatusFiltroCliente = 'ativos';

  readonly clientes = this._clientes.asReadonly();

  async getLista(status: StatusFiltroCliente = 'ativos'): Promise<ClienteResponseDto[]> {
    const clientes = await firstValueFrom(
      this.http.get<ClienteResponseDto[]>('/clientes', {
        params: { status },
      }),
    );

    this.statusConsulta = status;
    this._clientes.set(clientes);
    return clientes;
  }

  getEntidade(id: string): Promise<ClienteResponseDto> {
    return firstValueFrom(
      this.http.get<ClienteResponseDto>(`/clientes/${id}`),
    );
  }

  async setEntidade(dados: CriarClienteDto): Promise<ClienteResponseDto> {
    const clienteCriado = await firstValueFrom(
      this.http.post<ClienteResponseDto>('/clientes', dados),
    );

    if (this.statusConsulta !== 'inativos') {
      this._clientes.update((clientes) => [...clientes, clienteCriado]);
    }
    return clienteCriado;
  }

  async updateEntidade(id: string, dados: AtualizarClienteDto): Promise<ClienteResponseDto> {
    const clienteAtualizado = await firstValueFrom(this.http.put<ClienteResponseDto>(`/clientes/${id}`, dados));

    this._clientes.update((clientes) => clientes.map((cliente) => cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente));

    return clienteAtualizado;
  }

  async inativarEntidade(id: string): Promise<ClienteResponseDto> {
    const clienteInativado = await firstValueFrom(
      this.http.patch<ClienteResponseDto>(`/clientes/${id}/inativar`, {}),
    );

    this._clientes.update((clientes) =>
      this.statusConsulta === 'ativos'
        ? clientes.filter((cliente) => cliente.id !== clienteInativado.id)
        : clientes.map((cliente) =>
            cliente.id === clienteInativado.id ? clienteInativado : cliente,
          ),
    );

    return clienteInativado;
  }

  async reativarEntidade(id: string): Promise<ClienteResponseDto> {
    const clienteReativado = await firstValueFrom(
      this.http.patch<ClienteResponseDto>(`/clientes/${id}/reativar`, {}),
    );

    this._clientes.update((clientes) =>
      this.statusConsulta === 'inativos'
        ? clientes.filter((cliente) => cliente.id !== clienteReativado.id)
        : clientes.map((cliente) =>
            cliente.id === clienteReativado.id ? clienteReativado : cliente,
          ),
    );

    return clienteReativado;
  }

  async deleteEntidade(id: string): Promise<void> {
    await this.inativarEntidade(id);
  }
}
