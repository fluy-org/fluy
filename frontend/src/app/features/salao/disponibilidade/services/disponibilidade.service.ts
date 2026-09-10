import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AtualizarDisponibilidadeSemanalDto,
  AtualizarOverrideDisponibilidadeDto,
  DisponibilidadeSemanalResponseDto,
  ListaOverridesDisponibilidadeResponseDto,
  ListarOverridesDisponibilidadeQueryDto,
  OverrideDisponibilidadeResponseDto,
  ProfissionalResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DisponibilidadeService {
  private readonly http = inject(HttpClient);
  private readonly _profissionais = signal<ProfissionalResponseDto[]>([]);
  private readonly _disponibilidadeSemanal =
    signal<DisponibilidadeSemanalResponseDto | null>(null);
  private readonly _overrides = signal<OverrideDisponibilidadeResponseDto[]>([]);

  readonly profissionais = this._profissionais.asReadonly();
  readonly disponibilidadeSemanal = this._disponibilidadeSemanal.asReadonly();
  readonly overrides = this._overrides.asReadonly();

  async getLista(): Promise<ProfissionalResponseDto[]> {
    const profissionais = await firstValueFrom(
      this.http.get<ProfissionalResponseDto[]>('/profissionais'),
    );

    this._profissionais.set(profissionais);
    return profissionais;
  }

  async getEntidade(
    profissionalId: string,
  ): Promise<DisponibilidadeSemanalResponseDto> {
    const disponibilidade = await firstValueFrom(
      this.http.get<DisponibilidadeSemanalResponseDto>(
        `/profissionais/${profissionalId}/disponibilidade/semanal`,
      ),
    );

    this._disponibilidadeSemanal.set(disponibilidade);
    return disponibilidade;
  }

  async updateEntidade(
    profissionalId: string,
    dados: AtualizarDisponibilidadeSemanalDto,
  ): Promise<DisponibilidadeSemanalResponseDto> {
    const disponibilidade = await firstValueFrom(
      this.http.put<DisponibilidadeSemanalResponseDto>(
        `/profissionais/${profissionalId}/disponibilidade/semanal`,
        dados,
      ),
    );

    this._disponibilidadeSemanal.set(disponibilidade);
    return disponibilidade;
  }

  async getListaOverrides(
    profissionalId: string,
    periodo: ListarOverridesDisponibilidadeQueryDto,
  ): Promise<OverrideDisponibilidadeResponseDto[]> {
    const params = new HttpParams()
      .set('data_inicio', periodo.data_inicio)
      .set('data_fim', periodo.data_fim);
    const resposta = await firstValueFrom(
      this.http.get<ListaOverridesDisponibilidadeResponseDto>(
        `/profissionais/${profissionalId}/disponibilidade/overrides`,
        { params },
      ),
    );

    this._overrides.set(resposta.overrides);
    return resposta.overrides;
  }

  async setOverride(
    profissionalId: string,
    data: string,
    dados: AtualizarOverrideDisponibilidadeDto,
  ): Promise<OverrideDisponibilidadeResponseDto> {
    const override = await firstValueFrom(
      this.http.put<OverrideDisponibilidadeResponseDto>(
        `/profissionais/${profissionalId}/disponibilidade/overrides/${data}`,
        dados,
      ),
    );

    // A data identifica o override dentro do periodo atualmente carregado.
    this._overrides.update((overrides) => {
      const existente = overrides.some((item) => item.data === override.data);

      return existente
        ? overrides.map((item) => (item.data === override.data ? override : item))
        : [...overrides, override].sort((a, b) => a.data.localeCompare(b.data));
    });

    return override;
  }

  async deleteOverride(profissionalId: string, data: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        `/profissionais/${profissionalId}/disponibilidade/overrides/${data}`,
      ),
    );

    this._overrides.update((overrides) =>
      overrides.filter((override) => override.data !== data),
    );
  }
}
