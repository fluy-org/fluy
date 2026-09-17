import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonModal,
  IonSpinner,
  IonText,
  IonButton,
} from '@ionic/angular/standalone';
import { ApiError } from '../../../../../core/errors/api-error';
import { HeaderComponent } from '../../../../../shared/components/header/header.component';
import { AgendamentoCardComponent } from '../../components/agendamento-card/agendamento-card.component';
import { CalendarioMesComponent } from '../../components/calendario-mes/calendario-mes.component';
import { NavegacaoDiaComponent } from '../../components/navegacao-dia/navegacao-dia.component';
import { AgendaService } from '../../services/agenda.service';
import {
  agruparPorEncerramento,
  calcularIntervaloDoMes,
  extrairMesDaData,
  gerarGradeDoMes,
} from '../../agenda-utils';
import type { EstadoPaginaAgenda } from '../../contracts';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [
    AgendamentoCardComponent,
    CalendarioMesComponent,
    HeaderComponent,
    NavegacaoDiaComponent,
    IonButton,
    IonContent,
    IonHeader,
    IonModal,
    IonSpinner,
    IonText,
  ],
})
export class AgendaPage implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly router = inject(Router);

  readonly agendaDoDia = this.agendaService.agendaDoDia;
  readonly resumoDoPeriodo = this.agendaService.resumoDoPeriodo;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly offline = signal(false);

  readonly calendarioAberto = signal(false);
  readonly mesDoCalendario = signal('');
  readonly carregandoResumo = signal(false);
  readonly erroResumo = signal<string | null>(null);

  readonly grupos = computed(() =>
    agruparPorEncerramento(this.agendaDoDia()?.agendamentos ?? []),
  );

  readonly gradeDoCalendario = computed(() => {
    const mes = this.mesDoCalendario();

    return mes
      ? gerarGradeDoMes({
          mes,
          contagens: this.resumoDoPeriodo()?.dias ?? [],
        })
      : [];
  });

  readonly estadoPagina = computed<EstadoPaginaAgenda>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.offline()) {
      return 'offline';
    }

    if (this.erro()) {
      return 'erro';
    }

    return (this.agendaDoDia()?.agendamentos.length ?? 0) === 0
      ? 'vazio'
      : 'lista';
  });

  ngOnInit(): void {
    void this.carregar();
  }

  mudarDia(data: string): void {
    void this.carregar(data);
  }

  recarregar(): void {
    void this.carregar(this.agendaDoDia()?.data);
  }

  abrirCalendario(): void {
    const data = this.agendaDoDia()?.data;

    if (!data) {
      return;
    }

    this.mesDoCalendario.set(extrairMesDaData(data));
    this.calendarioAberto.set(true);
    void this.carregarResumo();
  }

  fecharCalendario(): void {
    this.calendarioAberto.set(false);
  }

  mudarMesDoCalendario(mes: string): void {
    this.mesDoCalendario.set(mes);
    void this.carregarResumo();
  }

  selecionarDiaDoCalendario(data: string): void {
    this.calendarioAberto.set(false);
    this.mudarDia(data);
  }

  async carregarResumo(): Promise<void> {
    const mes = this.mesDoCalendario();
    this.carregandoResumo.set(true);
    this.erroResumo.set(null);

    try {
      await this.agendaService.getResumo(calcularIntervaloDoMes(mes));
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      // Falha no resumo não bloqueia a navegação: a grade segue clicável, só
      // fica sem a contagem de cada dia.
      this.erroResumo.set(
        error.status === 0
          ? 'Sem conexão. A contagem do mês não pôde ser carregada.'
          : error.message,
      );
    } finally {
      this.carregandoResumo.set(false);
    }
  }

  abrirDetalhe(id: string): void {
    void this.router.navigate(['/painel/agenda', id]);
  }

  async carregar(data?: string): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    this.offline.set(false);

    try {
      await this.agendaService.getLista(data);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      // Status 0 é falha de rede: o painel bloqueia a operação em vez de
      // bufferizar, então a tela pede nova tentativa.
      if (error.status === 0) {
        this.offline.set(true);
      } else {
        this.erro.set(error.message);
      }
    } finally {
      this.carregando.set(false);
    }
  }
}
