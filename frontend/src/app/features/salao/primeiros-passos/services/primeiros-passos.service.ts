import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type { SalaoSetupResponseDto } from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrimeirosPassosService {
  private http = inject(HttpClient);

  private readonly _setup = signal<SalaoSetupResponseDto | null>(null);
  private readonly _carregando = signal(false);
  private readonly _erro = signal<string | null>(null);

  readonly setup = this._setup.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  readonly erro = this._erro.asReadonly();

  async carregar(): Promise<SalaoSetupResponseDto> {
    this._carregando.set(true);
    this._erro.set(null);

    try {
      const dados = await firstValueFrom(
        this.http.get<SalaoSetupResponseDto>('/saloes/eu/setup'),
      );
      this._setup.set(dados);
      return dados;
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        'Erro ao carregar status do salão.';
      this._erro.set(msg);
      throw err;
    } finally {
      this._carregando.set(false);
    }
  }
}
