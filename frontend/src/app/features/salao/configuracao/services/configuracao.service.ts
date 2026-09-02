import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AtualizarConfiguracaoSalaoDto,
  ConfiguracaoSalaoResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private http = inject(HttpClient);
  private readonly _configuracao = signal<ConfiguracaoSalaoResponseDto | null>(null);

  readonly configuracao = this._configuracao.asReadonly();

  async getEntidade(): Promise<ConfiguracaoSalaoResponseDto> {
    const configuracao = await firstValueFrom(this.http.get<ConfiguracaoSalaoResponseDto>('/salao/configuracao'),);

    this._configuracao.set(configuracao);
    return configuracao;
  }

  async updateEntidade(dados: AtualizarConfiguracaoSalaoDto,): Promise<ConfiguracaoSalaoResponseDto> {
    const configuracaoAtualizada = await firstValueFrom(this.http.put<ConfiguracaoSalaoResponseDto>('/salao/configuracao', dados,),);

    // Atualiza o estado com o retorno completo do backend, sem fazer outro GET.
    this._configuracao.set(configuracaoAtualizada);
    return configuracaoAtualizada;
  }
}
