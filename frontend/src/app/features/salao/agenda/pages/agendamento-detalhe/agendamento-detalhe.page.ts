import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type {
  AcaoAgendamento,
  AvaliacaoHorarioAgendamentoResponseDto,
  CancelarAgendamentoDto,
  ConcluirAgendamentoDto,
  HorariosLivresResponseDto,
  RemarcarAgendamentoDto,
} from '@fluy/schema';
import {
  IonBackButton,
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
import { DetalheAgendamentoComponent } from '../../components/detalhe-agendamento/detalhe-agendamento.component';
import { ConfirmacaoFaltaComponent } from '../../components/confirmacao-falta/confirmacao-falta.component';
import { FormularioCancelamentoComponent } from '../../components/formulario-cancelamento/formulario-cancelamento.component';
import { FormularioConclusaoComponent } from '../../components/formulario-conclusao/formulario-conclusao.component';
import { FormularioRemarcacaoComponent } from '../../components/formulario-remarcacao/formulario-remarcacao.component';
import { AgendaService } from '../../services/agenda.service';
import {
  ACOES_DO_ATENDIMENTO,
  ACOES_SEM_ATENDIMENTO,
  ESTILO_ACAO_AGENDAMENTO,
  ROTULO_AVISO_ACAO_AGENDAMENTO,
} from '../../agenda-data';

import type { EstadoPaginaDetalhe } from '../../contracts';

@Component({
  selector: 'app-agendamento-detalhe',
  templateUrl: './agendamento-detalhe.page.html',
  styleUrls: ['./agendamento-detalhe.page.scss'],
  standalone: true,
  imports: [
    ConfirmacaoFaltaComponent,
    DetalheAgendamentoComponent,
    FormularioCancelamentoComponent,
    FormularioConclusaoComponent,
    FormularioRemarcacaoComponent,
      IonBackButton,
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
  // O modal aberto é identificado pela própria ação que o abriu, o mesmo enum
  // que `acionar()` recebe do contrato de `acoes_permitidas`.
  readonly acaoAberta = signal<AcaoAgendamento | null>(null);
  readonly executando = signal(false);
  readonly erroAcao = signal<string | null>(null);
  readonly horariosDaRemarcacao = signal<HorariosLivresResponseDto['horarios']>(
    [],
  );
  readonly carregandoHorarios = signal(false);
  readonly avaliacaoDaRemarcacao =
    signal<AvaliacaoHorarioAgendamentoResponseDto | null>(null);

  readonly estadoPagina = computed<EstadoPaginaDetalhe>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.offline()) {
      return 'offline';
    }

    return this.erro() ? 'erro' : 'detalhe';
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

  acionar(acao: AcaoAgendamento): void {
    if (acao === 'remarcar') {
      this.dataDaRemarcacao.set('');
      this.horariosDaRemarcacao.set([]);
      this.avaliacaoDaRemarcacao.set(null);
    }

    this.erroAcao.set(null);
    this.acaoAberta.set(acao);
  }

  fecharAcao(): void {
    if (this.executando()) {
      return;
    }

    this.acaoAberta.set(null);
  }

  aoFecharAcao(): void {
    // Sincroniza o signal quando o usuário fecha o modal por gesto ou backdrop.
    // Sem isso, um fechamento durante o envio deixaria o signal preenchido e o
    // botão da ação pararia de reabrir o modal.
    this.erroAcao.set(null);
    this.acaoAberta.set(null);
  }

  confirmarConclusao(dados: ConcluirAgendamentoDto): Promise<void> {
    return this.executarAcao(
      (id) => this.agendaService.concluir(id, dados),
      'Sem conexão. A conclusão não foi registrada.',
    );
  }

  confirmarFalta(): Promise<void> {
    return this.executarAcao(
      (id) => this.agendaService.marcarFalta(id),
      'Sem conexão. O no-show não foi registrado.',
    );
  }

  confirmarCancelamento(dados: CancelarAgendamentoDto): Promise<void> {
    return this.executarAcao(
      (id) => this.agendaService.cancelar(id, dados),
      'Sem conexão. O cancelamento não foi registrado.',
    );
  }

  confirmarRemarcacao(dados: RemarcarAgendamentoDto): Promise<void> {
    return this.executarAcao(
      (id) => this.agendaService.remarcar(id, dados),
      'Sem conexão. A remarcação não foi registrada.',
    );
  }

  async carregarHorariosDaRemarcacao(data: string): Promise<void> {
    const id = this.agendamento()?.id;

    this.dataDaRemarcacao.set(data);
    this.horariosDaRemarcacao.set([]);
    this.avaliacaoDaRemarcacao.set(null);

    if (!id) {
      return;
    }

    this.carregandoHorarios.set(true);
    this.erroAcao.set(null);

    try {
      const resposta = await this.agendaService.getHorariosLivresParaRemarcacao(
        id,
        { data },
      );

      this.horariosDaRemarcacao.set(resposta.horarios);
    } catch (error) {
      this.tratarErroDaAcao(error, 'Sem conexão. Os horários não foram carregados.');
    } finally {
      this.carregandoHorarios.set(false);
    }
  }

  async avaliarHorarioDaRemarcacao(horaInicio: string): Promise<void> {
    const id = this.agendamento()?.id;
    const data = this.dataDaRemarcacao();

    this.avaliacaoDaRemarcacao.set(null);

    if (!id || !data || !horaInicio) {
      return;
    }

    this.erroAcao.set(null);

    try {
      this.avaliacaoDaRemarcacao.set(
        await this.agendaService.avaliarHorarioParaRemarcacao(id, {
          data,
          hora_inicio: horaInicio,
        }),
      );
    } catch (error) {
      this.tratarErroDaAcao(error, 'Sem conexão. O horário não foi avaliado.');
    }
  }

  private readonly dataDaRemarcacao = signal('');

  private async executarAcao(
    operacao: (id: string) => Promise<unknown>,
    mensagemOffline: string,
  ): Promise<void> {
    const id = this.agendamento()?.id;

    if (!id) {
      return;
    }

    this.executando.set(true);
    this.erroAcao.set(null);

    try {
      await operacao(id);
      this.acaoAberta.set(null);
    } catch (error) {
      this.tratarErroDaAcao(error, mensagemOffline);
    } finally {
      this.executando.set(false);
    }
  }

  private tratarErroDaAcao(error: unknown, mensagemOffline: string): void {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    // Status 0 é falha de rede: o painel bloqueia a operação em vez de
    // bufferizar, então a mensagem diz que nada foi gravado.
    this.erroAcao.set(error.status === 0 ? mensagemOffline : error.message);
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
