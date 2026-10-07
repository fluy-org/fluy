import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AvisoResponseDto, ListaAvisosResponseDto } from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly http = inject(HttpClient);

  listarSalao(cursor?: string): Promise<ListaAvisosResponseDto> {
    return firstValueFrom(
      this.http.get<ListaAvisosResponseDto>('/avisos', {
        params: cursor ? { cursor } : {},
      }),
    );
  }

  reconhecerSalao(id: string): Promise<AvisoResponseDto> {
    return firstValueFrom(
      this.http.patch<AvisoResponseDto>(
        `/avisos/${encodeURIComponent(id)}/reconhecer`,
        {},
      ),
    );
  }

  listarCliente(
    subdominio: string,
    credencial: string,
    cursor?: string,
  ): Promise<ListaAvisosResponseDto> {
    return firstValueFrom(
      this.http.get<ListaAvisosResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/avisos`,
        {
          params: {
            credencial,
            ...(cursor ? { cursor } : {}),
          },
        },
      ),
    );
  }

  reconhecerCliente(
    subdominio: string,
    credencial: string,
    id: string,
  ): Promise<AvisoResponseDto> {
    return firstValueFrom(
      this.http.patch<AvisoResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/avisos/${encodeURIComponent(id)}/reconhecer`,
        { credencial },
      ),
    );
  }
}
