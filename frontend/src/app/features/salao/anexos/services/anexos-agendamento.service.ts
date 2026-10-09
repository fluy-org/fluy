import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AnexoAgendamentoResponseDto,
  ListaAnexosAgendamentoResponseDto,
  ListaAnexosClienteResponseDto,
  VisibilidadeAnexo,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnexosAgendamentoService {
  private readonly http = inject(HttpClient);
  private readonly _anexos = signal<AnexoAgendamentoResponseDto[]>([]);

  readonly anexos = this._anexos.asReadonly();

  async getLista(
    agendamentoId: string,
  ): Promise<ListaAnexosAgendamentoResponseDto> {
    const resposta = await firstValueFrom(
      this.http.get<ListaAnexosAgendamentoResponseDto>(
        `/agendamentos/${agendamentoId}/anexos`,
      ),
    );

    this._anexos.set(resposta.anexos);
    return resposta;
  }

  async setEntidade({
    agendamentoId,
    arquivo,
  }: {
    agendamentoId: string;
    arquivo: File;
  }): Promise<AnexoAgendamentoResponseDto> {
    const dados = new FormData();
    dados.append('arquivo', arquivo);

    const anexo = await firstValueFrom(
      this.http.post<AnexoAgendamentoResponseDto>(
        `/agendamentos/${agendamentoId}/anexos`,
        dados,
      ),
    );

    this._anexos.update((anexos) => [...anexos, anexo]);
    return anexo;
  }

  async deleteEntidade({
    agendamentoId,
    id,
  }: {
    agendamentoId: string;
    id: string;
  }): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`/agendamentos/${agendamentoId}/anexos/${id}`),
    );
    this._anexos.update((anexos) => anexos.filter((anexo) => anexo.id !== id));
  }

  getConteudo({
    agendamentoId,
    id,
  }: {
    agendamentoId: string;
    id: string;
  }): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`/agendamentos/${agendamentoId}/anexos/${id}/conteudo`, {
        responseType: 'blob',
      }),
    );
  }

  getReferencias(
    agendamentoId: string,
  ): Promise<ListaAnexosAgendamentoResponseDto> {
    return firstValueFrom(
      this.http.get<ListaAnexosAgendamentoResponseDto>(
        `/agendamentos/${agendamentoId}/anexos/referencias`,
      ),
    );
  }

  getConteudoReferencia({
    agendamentoId,
    id,
  }: {
    agendamentoId: string;
    id: string;
  }): Promise<Blob> {
    return firstValueFrom(
      this.http.get(
        `/agendamentos/${agendamentoId}/anexos/referencias/${id}/conteudo`,
        { responseType: 'blob' },
      ),
    );
  }

  getGaleriaCliente({
    clienteId,
    cursor,
    visibilidade,
  }: {
    clienteId: string;
    cursor?: string;
    visibilidade: VisibilidadeAnexo;
  }): Promise<ListaAnexosClienteResponseDto> {
    return firstValueFrom(
      this.http.get<ListaAnexosClienteResponseDto>(
        `/clientes/${clienteId}/anexos`,
        {
          params: {
            visibilidade,
            ...(cursor ? { cursor } : {}),
          },
        },
      ),
    );
  }

  getConteudoGaleriaCliente({
    clienteId,
    id,
  }: {
    clienteId: string;
    id: string;
  }): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`/clientes/${clienteId}/anexos/${id}/conteudo`, {
        responseType: 'blob',
      }),
    );
  }
}
