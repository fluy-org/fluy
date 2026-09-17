import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AgendaDiaResponseDto,
  AgendamentoDetalheResponseDto,
  ResumoAgendaResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly _agendaDoDia = signal<AgendaDiaResponseDto | null>(null);
  private readonly _agendamento =
    signal<AgendamentoDetalheResponseDto | null>(null);
  private readonly _resumoDoPeriodo = signal<ResumoAgendaResponseDto | null>(
    null,
  );

  readonly agendaDoDia = this._agendaDoDia.asReadonly();
  readonly agendamento = this._agendamento.asReadonly();
  readonly resumoDoPeriodo = this._resumoDoPeriodo.asReadonly();

  async getLista(data?: string): Promise<AgendaDiaResponseDto> {
    const params = data ? new HttpParams().set('data', data) : undefined;
    const agenda = await firstValueFrom(
      this.http.get<AgendaDiaResponseDto>('/agendamentos', { params }),
    );

    this._agendaDoDia.set(agenda);
    return agenda;
  }

  async getResumo({
    dataInicio,
    dataFim,
  }: {
    dataInicio: string;
    dataFim: string;
  }): Promise<ResumoAgendaResponseDto> {
    // Limpa antes de buscar: manter a contagem do período anterior pintaria
    // números de outro mês na grade enquanto a busca corre ou se ela falhar.
    this._resumoDoPeriodo.set(null);

    const params = new HttpParams()
      .set('data_inicio', dataInicio)
      .set('data_fim', dataFim);
    const resumo = await firstValueFrom(
      this.http.get<ResumoAgendaResponseDto>('/agendamentos/resumo', {
        params,
      }),
    );

    this._resumoDoPeriodo.set(resumo);
    return resumo;
  }

  async getEntidade(id: string): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.get<AgendamentoDetalheResponseDto>(`/agendamentos/${id}`),
    );

    this._agendamento.set(agendamento);
    return agendamento;
  }
}
