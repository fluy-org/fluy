import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type {
  IdentificarClientePublicaDto,
  HorariosLivresResponseDto,
  ListarHorariosLivresPublicosQueryDto,
  CriarAgendamentoPublicoDto,
  AgendamentoResponseDto,
  AgendamentoClienteResponseDto,
  AgendamentoPublicoDetalheResponseDto,
  ListaAgendamentosClienteResponseDto,
  ProcedimentoPublicoResponseDto,
  SalaoPublicoResponseDto,
  SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaginaClienteService {
  private readonly http = inject(HttpClient);
  private readonly _salao = signal<SalaoPublicoResponseDto | null>(null);
  private readonly _procedimentos = signal<ProcedimentoPublicoResponseDto[]>([]);
  private readonly _agendamentos = signal<AgendamentoClienteResponseDto[]>([]);
  private readonly _fusoHorarioAgendamentos = signal<string | null>(null);
  private readonly _proximoCursorAgendamentos = signal<string | null>(null);

  readonly salao = this._salao.asReadonly();
  readonly procedimentos = this._procedimentos.asReadonly();
  readonly agendamentos = this._agendamentos.asReadonly();
  readonly fusoHorarioAgendamentos = this._fusoHorarioAgendamentos.asReadonly();
  readonly proximoCursorAgendamentos =
    this._proximoCursorAgendamentos.asReadonly();

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

  async getProcedimentos(subdominio: string): Promise<ProcedimentoPublicoResponseDto[]> {
    const procedimentos = await firstValueFrom(
      this.http.get<ProcedimentoPublicoResponseDto[]>(
        `/publico/s/${encodeURIComponent(subdominio)}/procedimentos`,
      ),
    );

    this._procedimentos.set(procedimentos);
    return procedimentos;
  }

  listarHorariosLivres(
    subdominio: string,
    dados: ListarHorariosLivresPublicosQueryDto,
  ): Promise<HorariosLivresResponseDto> {
    return firstValueFrom(
      this.http.get<HorariosLivresResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos/horarios-livres`,
        { params: dados },
      ),
    );
  }

  criarAgendamento(
    subdominio: string,
    dados: CriarAgendamentoPublicoDto,
  ): Promise<AgendamentoResponseDto> {
    return firstValueFrom(
      this.http.post<AgendamentoResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos`,
        dados,
      ),
    );
  }

  async getAgendamentos(
    subdominio: string,
    credencial: string,
    cursor?: string,
  ): Promise<ListaAgendamentosClienteResponseDto> {
    const resposta = await firstValueFrom(
      this.http.get<ListaAgendamentosClienteResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos`,
        { params: { credencial, ...(cursor ? { cursor } : {}) } },
      ),
    );

    this._agendamentos.update((atuais) =>
      cursor ? [...atuais, ...resposta.itens] : resposta.itens,
    );
    this._fusoHorarioAgendamentos.set(resposta.fuso_horario);
    this._proximoCursorAgendamentos.set(resposta.proximo_cursor);
    return resposta;
  }

  getAgendamento(
    subdominio: string,
    id: string,
    credencial: string,
  ): Promise<AgendamentoPublicoDetalheResponseDto> {
    return firstValueFrom(
      this.http.get<AgendamentoPublicoDetalheResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos/${encodeURIComponent(id)}`,
        { params: { credencial } },
      ),
    );
  }

  async cancelarAgendamento(
    subdominio: string,
    id: string,
    credencial: string,
  ): Promise<AgendamentoPublicoDetalheResponseDto> {
    const resposta = await firstValueFrom(
      this.http.patch<AgendamentoPublicoDetalheResponseDto>(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos/${encodeURIComponent(id)}/cancelar`,
        { credencial },
      ),
    );

    this._agendamentos.update((agendamentos) =>
      agendamentos.map((agendamento) =>
        agendamento.id === resposta.id
          ? { ...agendamento, estado: resposta.estado }
          : agendamento,
      ),
    );
    return resposta;
  }

  limparAgendamentos(): void {
    this._agendamentos.set([]);
    this._fusoHorarioAgendamentos.set(null);
    this._proximoCursorAgendamentos.set(null);
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
