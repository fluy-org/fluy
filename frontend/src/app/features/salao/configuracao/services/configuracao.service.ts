import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AtualizarConfiguracaoSalaoDto,
  AtualizarRecebimentoPixDto,
  RecebimentoPixResponseDto,
  ConfiguracaoSalaoResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private http = inject(HttpClient);
  private readonly _configuracao = signal<ConfiguracaoSalaoResponseDto | null>(
    null,
  );

  private readonly _recebimento = signal<RecebimentoPixResponseDto | null>(
    null,
  );
  readonly recebimento = this._recebimento.asReadonly();

  async getRecebimento(): Promise<RecebimentoPixResponseDto> {
    const dados = await firstValueFrom(
      this.http.get<RecebimentoPixResponseDto>(
        '/salao/configuracao/recebimento-pix',
      ),
    );
    this._recebimento.set(dados);
    return dados;
  }

  async updateRecebimento(
    dados: AtualizarRecebimentoPixDto,
  ): Promise<RecebimentoPixResponseDto> {
    const atualizado = await firstValueFrom(
      this.http.put<RecebimentoPixResponseDto>(
        '/salao/configuracao/recebimento-pix',
        dados,
      ),
    );
    this._recebimento.set(atualizado);
    return atualizado;
  }

  readonly configuracao = this._configuracao.asReadonly();

  async getEntidade(): Promise<ConfiguracaoSalaoResponseDto> {
    const configuracao = await firstValueFrom(
      this.http.get<ConfiguracaoSalaoResponseDto>('/salao/configuracao'),
    );

    this._configuracao.set(configuracao);
    return configuracao;
  }

  async updateEntidade(
    dados: AtualizarConfiguracaoSalaoDto,
  ): Promise<ConfiguracaoSalaoResponseDto> {
    const configuracaoAtualizada = await firstValueFrom(
      this.http.put<ConfiguracaoSalaoResponseDto>('/salao/configuracao', dados),
    );

    // Atualiza o estado com o retorno completo do backend, sem fazer outro GET.
    this._configuracao.set(configuracaoAtualizada);
    return configuracaoAtualizada;
  }
}
