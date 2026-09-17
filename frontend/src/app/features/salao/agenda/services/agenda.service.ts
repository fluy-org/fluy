import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AgendaDiaResponseDto,
  AgendamentoDetalheResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly _agendaDoDia = signal<AgendaDiaResponseDto | null>(null);
  private readonly _agendamento =
    signal<AgendamentoDetalheResponseDto | null>(null);

  readonly agendaDoDia = this._agendaDoDia.asReadonly();
  readonly agendamento = this._agendamento.asReadonly();

  async getLista(data?: string): Promise<AgendaDiaResponseDto> {
    const params = data ? new HttpParams().set('data', data) : undefined;
    const agenda = await firstValueFrom(
      this.http.get<AgendaDiaResponseDto>('/agendamentos', { params }),
    );

    this._agendaDoDia.set(agenda);
    return agenda;
  }

  async getEntidade(id: string): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.get<AgendamentoDetalheResponseDto>(`/agendamentos/${id}`),
    );

    this._agendamento.set(agendamento);
    return agendamento;
  }
}
