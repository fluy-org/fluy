import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { AcaoAgendamento, ConcluirAgendamentoDto } from '@fluy/schema';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ApiError } from '../../../../../core/errors/api-error';
import { HoraSalaoPipe } from '../../../../../shared/pipes/hora-salao.pipe';
import { FormularioConclusaoComponent } from '../../components/formulario-conclusao/formulario-conclusao.component';
import { AgendaService } from '../../services/agenda.service';
import {
  ACOES_DO_ATENDIMENTO,
  ACOES_SEM_ATENDIMENTO,
  ESTILO_ACAO_AGENDAMENTO,
  ESTILO_ESTADO_AGENDAMENTO,
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
    FormularioConclusaoComponent,
    HoraSalaoPipe,
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonModal,
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
  readonly conclusaoAberta = signal(false);
  readonly concluindo = signal(false);
  readonly erroConclusao = signal<string | null>(null);

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

  readonly temAcoes = computed(
    () => (this.agendamento()?.acoes_permitidas ?? []).length > 0,
  );

  readonly acoesDoAtendimento = computed(() =>
    this.montarAcoes(ACOES_DO_ATENDIMENTO),
  );

  readonly acoesSemAtendimento = computed(() =>
    this.montarAcoes(ACOES_SEM_ATENDIMENTO),
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

  // As demais ações do detalhe chegam nas fatias 3.3 e 3.4.
  acionar(acao: AcaoAgendamento): void {
    if (acao === 'concluir') {
      this.abrirConclusao();
    }
  }

  abrirConclusao(): void {
    this.erroConclusao.set(null);
    this.conclusaoAberta.set(true);
  }

  fecharConclusao(): void {
    if (this.concluindo()) {
      return;
    }

    this.conclusaoAberta.set(false);
  }

  aoFecharConclusao(): void {
    // Sincroniza o signal quando o usuário fecha o modal por gesto ou backdrop.
    // Sem isso, um fechamento durante o envio deixaria o signal aberto e o
    // botão de concluir pararia de reabrir o modal.
    this.erroConclusao.set(null);
    this.conclusaoAberta.set(false);
  }

  async confirmarConclusao(dados: ConcluirAgendamentoDto): Promise<void> {
    const id = this.agendamento()?.id;

    if (!id) {
      return;
    }

    this.concluindo.set(true);
    this.erroConclusao.set(null);

    try {
      await this.agendaService.concluir(id, dados);
      this.conclusaoAberta.set(false);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroConclusao.set(
        error.status === 0
          ? 'Sem conexão. A conclusão não foi registrada.'
          : error.message,
      );
    } finally {
      this.concluindo.set(false);
    }
  }

  valorFormatado(valor: number): string {
    return formatarValor(valor);
  }

  private montarAcoes(ordemDeExibicao: AcaoAgendamento[]) {
    const permitidas = this.agendamento()?.acoes_permitidas ?? [];

    return ordemDeExibicao
      .filter((acao) => permitidas.includes(acao))
      .map((acao) => ({ acao, ...ESTILO_ACAO_AGENDAMENTO[acao] }));
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
