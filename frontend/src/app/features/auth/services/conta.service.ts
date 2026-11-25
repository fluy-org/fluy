import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { UsuarioAtualResponseDto, UsuarioResponseDto } from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);
  private contaAtualCache: Promise<UsuarioAtualResponseDto> | null = null;

  materializar(): Promise<UsuarioResponseDto> {
    this.limparCache();
    return firstValueFrom(this.http.post<UsuarioResponseDto>('/usuarios', null));
  }

  consultarAtual(forcarAtualizacao = false): Promise<UsuarioAtualResponseDto> {
    if (forcarAtualizacao || !this.contaAtualCache) {
      this.contaAtualCache = firstValueFrom(
        this.http.get<UsuarioAtualResponseDto>('/usuarios/eu'),
      ).catch((erro) => {
        this.contaAtualCache = null;
        throw erro;
      });
    }

    return this.contaAtualCache;
  }

  limparCache(): void {
    this.contaAtualCache = null;
  }
}
