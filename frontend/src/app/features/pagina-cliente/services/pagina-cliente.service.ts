import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type {
  IdentificarClientePublicaDto,
  SalaoPublicoResponseDto,
  SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaginaClienteService {
  private readonly http = inject(HttpClient);
  private readonly _salao = signal<SalaoPublicoResponseDto | null>(null);

  readonly salao = this._salao.asReadonly();

  async getEntidade(subdominio: string): Promise<SalaoPublicoResponseDto> {
    const salao = await firstValueFrom(
      this.http.get<SalaoPublicoResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/salao`,
      ),
    );

    this._salao.set(salao);
    return salao;
  }

  consultarSessao(subdominio: string, credencial: string) {
    return firstValueFrom(
      this.http.get<SessaoClientePublicaResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/cliente/sessao`,
        { params: { credencial } },
      ),
    );
  }

  identificar(
    subdominio: string,
    dados: IdentificarClientePublicaDto,
  ) {
    return firstValueFrom(
      this.http.post<SessaoClientePublicaResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/cliente/identificacao`,
        dados,
      ),
    );
  }

  obterCredencial(subdominio: string): string | null {
    return localStorage.getItem(this.chaveCredencial(subdominio));
  }

  criarCredencial(subdominio: string): string {
    const credencial = crypto.randomUUID();
    localStorage.setItem(this.chaveCredencial(subdominio), credencial);
    return credencial;
  }

  removerCredencial(subdominio: string): void {
    localStorage.removeItem(this.chaveCredencial(subdominio));
  }

  private chaveCredencial(subdominio: string): string {
    return `fluy:cliente:${subdominio}:dispositivo`;
  }
}
