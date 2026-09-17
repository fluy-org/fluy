import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ApiError } from '../../../../../core/errors/api-error';
import { HoraSalaoPipe } from '../../../../../shared/pipes/hora-salao.pipe';
import { AgendaService } from '../../services/agenda.service';
import {
  ESTILO_ESTADO_AGENDAMENTO,
  ROTULO_ACAO_AGENDAMENTO,
  ROTULO_AVISO_ACAO_AGENDAMENTO,
} from '../../agenda-data';
import {
  formatarDataPorExtenso,
  formatarDuracao,
  formatarValor,
  formatarWhatsapp,
} from '../../agenda-utils';
import type { EstadoPaginaDetalhe } from '../../contracts';

@Component({
  selector: 'app-agendamento-detalhe',
  templateUrl: './agendamento-detalhe.page.html',
  styleUrls: ['./agendamento-detalhe.page.scss'],
  standalone: true,
  imports: [
    HoraSalaoPipe,
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class AgendamentoDetalhePage implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly route = inject(ActivatedRoute);

  readonly agendamento = this.agendaService.agendamento;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly offline = signal(false);

  readonly estadoPagina = computed<EstadoPaginaDetalhe>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.offline()) {
      return 'offline';
    }

    return this.erro() ? 'erro' : 'detalhe';
  });

  readonly estilo = computed(() => {
    const agendamento = this.agendamento();

    return agendamento
      ? ESTILO_ESTADO_AGENDAMENTO[agendamento.estado]
      : undefined;
  });

  readonly duracao = computed(() => {
    const agendamento = this.agendamento();

    return agendamento ? formatarDuracao(agendamento.duracao_min) : '';
  });

  readonly dataPorExtenso = computed(() => {
    const agendamento = this.agendamento();

    if (!agendamento) {
      return '';
    }

    const dataCivil = new Intl.DateTimeFormat('en-CA', {
      timeZone: agendamento.fuso_horario,
    }).format(new Date(agendamento.inicio_em));

    return formatarDataPorExtenso(dataCivil);
  });

  readonly whatsapp = computed(() => {
    const agendamento = this.agendamento();

    return agendamento ? formatarWhatsapp(agendamento.cliente.whatsapp) : '';
  });

  readonly acoes = computed(() =>
    (this.agendamento()?.acoes_permitidas ?? []).map((acao) => ({
      acao,
      rotulo: ROTULO_ACAO_AGENDAMENTO[acao] ?? acao,
    })),
  );

  readonly avisos = computed(() =>
    (this.agendamento()?.avisos ?? []).map(
      (aviso) => ROTULO_AVISO_ACAO_AGENDAMENTO[aviso] ?? aviso,
    ),
  );

  ngOnInit(): void {
    void this.carregar();
  }

  recarregar(): void {
    void this.carregar();
  }

  valorFormatado(valor: number): string {
    return formatarValor(valor);
  }

  async carregar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.offline.set(false);

    try {
      await this.agendaService.getEntidade(id);
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
