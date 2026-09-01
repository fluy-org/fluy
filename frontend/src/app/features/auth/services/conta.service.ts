import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { UsuarioAtualResponseDto, UsuarioResponseDto } from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);

  materializar(): Promise<UsuarioResponseDto> {
    return firstValueFrom(this.http.post<UsuarioResponseDto>('/usuarios', null));
  }

  consultarAtual(): Promise<UsuarioAtualResponseDto> {
    return firstValueFrom(
      this.http.get<UsuarioAtualResponseDto>('/usuarios/eu'),
    );
  }
}