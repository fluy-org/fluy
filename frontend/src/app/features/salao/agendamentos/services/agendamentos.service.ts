import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AgendamentoResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  AvaliarHorarioAgendamentoQueryDto,
  CriarAgendamentoDto,
  HorariosLivresResponseDto,
  ListarHorariosLivresQueryDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendamentosService {
  private readonly http = inject(HttpClient);
  private readonly _agendamentoCriado = signal<AgendamentoResponseDto | null>(
    null,
  );

  readonly agendamentoCriado = this._agendamentoCriado.asReadonly();

  getHorariosLivres(
    dados: ListarHorariosLivresQueryDto,
  ): Promise<HorariosLivresResponseDto> {
    return firstValueFrom(
      this.http.get<HorariosLivresResponseDto>(
        '/agendamentos/horarios-livres',
        { params: dados },
      ),
    );
  }

  avaliarHorario(
    dados: AvaliarHorarioAgendamentoQueryDto,
  ): Promise<AvaliacaoHorarioAgendamentoResponseDto> {
    return firstValueFrom(
      this.http.get<AvaliacaoHorarioAgendamentoResponseDto>(
        '/agendamentos/avaliacao',
        { params: dados },
      ),
    );
  }

  async setEntidade(
    dados: CriarAgendamentoDto,
  ): Promise<AgendamentoResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.post<AgendamentoResponseDto>('/agendamentos', dados),
    );

    this._agendamentoCriado.set(agendamento);
    return agendamento;
  }
}
