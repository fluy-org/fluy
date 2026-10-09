import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AgendaDiaResponseDto,
  AgendamentoDetalheResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  AvaliarHorarioRemarcacaoQueryDto,
  CancelarAgendamentoDto,
  ConcluirAgendamentoDto,
  HorariosLivresResponseDto,
  ListarHorariosLivresRemarcacaoQueryDto,
  RemarcarAgendamentoDto,
  ResumoAgendaResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly _agendaDoDia = signal<AgendaDiaResponseDto | null>(null);
  private readonly _agendamento = signal<AgendamentoDetalheResponseDto | null>(
    null,
  );
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

  async concluir(
    id: string,
    dados: ConcluirAgendamentoDto,
  ): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.patch<AgendamentoDetalheResponseDto>(
        `/agendamentos/${id}/concluir`,
        dados,
      ),
    );

    this._agendamento.set(agendamento);
    this.substituirNaAgendaDoDia(agendamento);

    return agendamento;
  }

  async marcarFalta(id: string): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.patch<AgendamentoDetalheResponseDto>(
        `/agendamentos/${id}/marcar-falta`,
        {},
      ),
    );

    this._agendamento.set(agendamento);
    this.substituirNaAgendaDoDia(agendamento);

    return agendamento;
  }

  async cancelar(
    id: string,
    dados: CancelarAgendamentoDto,
  ): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.patch<AgendamentoDetalheResponseDto>(
        `/agendamentos/${id}/cancelar`,
        dados,
      ),
    );

    this._agendamento.set(agendamento);
    this.substituirNaAgendaDoDia(agendamento);

    return agendamento;
  }

  getHorariosLivresParaRemarcacao(
    id: string,
    dados: ListarHorariosLivresRemarcacaoQueryDto,
  ): Promise<HorariosLivresResponseDto> {
    return firstValueFrom(
      this.http.get<HorariosLivresResponseDto>(
        `/agendamentos/${id}/horarios-livres`,
        { params: { ...dados } },
      ),
    );
  }

  avaliarHorarioParaRemarcacao(
    id: string,
    dados: AvaliarHorarioRemarcacaoQueryDto,
  ): Promise<AvaliacaoHorarioAgendamentoResponseDto> {
    return firstValueFrom(
      this.http.get<AvaliacaoHorarioAgendamentoResponseDto>(
        `/agendamentos/${id}/avaliacao`,
        { params: { ...dados } },
      ),
    );
  }

  async remarcar(
    id: string,
    dados: RemarcarAgendamentoDto,
  ): Promise<AgendamentoDetalheResponseDto> {
    const agendamento = await firstValueFrom(
      this.http.patch<AgendamentoDetalheResponseDto>(
        `/agendamentos/${id}/remarcar`,
        dados,
      ),
    );

    this._agendamento.set(agendamento);
    this.moverNaAgendaDoDia({ agendamento, data: dados.data });

    return agendamento;
  }

  // As notas são gravadas pela feature de notas; aqui só se reflete no
  // detalhe e no card se o agendamento tem observação, sem recarregar a agenda.
  atualizarObservacao({
    id,
    temObservacoes,
  }: {
    id: string;
    temObservacoes: boolean;
  }): void {
    this._agendamento.update((agendamento) =>
      agendamento?.id === id
        ? { ...agendamento, tem_observacoes: temObservacoes }
        : agendamento,
    );
    this._agendaDoDia.update((agenda) =>
      agenda
        ? {
            ...agenda,
            agendamentos: agenda.agendamentos.map((item) =>
              item.id === id
                ? { ...item, tem_observacoes: temObservacoes }
                : item,
            ),
          }
        : agenda,
    );
  }

  atualizarQuantidadeAnexos({
    id,
    quantidade,
  }: {
    id: string;
    quantidade: number;
  }): void {
    this._agendamento.update((agendamento) =>
      agendamento?.id === id
        ? { ...agendamento, quantidade_anexos: quantidade }
        : agendamento,
    );
    this._agendaDoDia.update((agenda) =>
      agenda
        ? {
            ...agenda,
            agendamentos: agenda.agendamentos.map((item) =>
              item.id === id
                ? { ...item, quantidade_anexos: quantidade }
                : item,
            ),
          }
        : agenda,
    );
  }

  private substituirNaAgendaDoDia(
    agendamento: AgendamentoDetalheResponseDto,
  ): void {
    this._agendaDoDia.update((agenda) =>
      agenda
        ? {
            ...agenda,
            agendamentos: agenda.agendamentos.map((item) =>
              item.id === agendamento.id ? agendamento : item,
            ),
          }
        : agenda,
    );
  }

  private moverNaAgendaDoDia({
    agendamento,
    data,
  }: {
    agendamento: AgendamentoDetalheResponseDto;
    data: string;
  }): void {
    this._agendaDoDia.update((agenda) => {
      if (!agenda) {
        return agenda;
      }

      const outros = agenda.agendamentos.filter(
        (item) => item.id !== agendamento.id,
      );

      if (agenda.data !== data) {
        return { ...agenda, agendamentos: outros };
      }

      return {
        ...agenda,
        agendamentos: [...outros, agendamento].sort((primeiro, segundo) =>
          primeiro.inicio_em.localeCompare(segundo.inicio_em),
        ),
      };
    });
  }
}
