import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import {
  ChangeDetectionStrategy,
  computed,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  type AgendamentoPublicoDetalheResponseDto,
  type ProcedimentoPublicoResponseDto,
  type HorariosLivresResponseDto,
  identificarClientePublicaSchema,
  type SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import type { InfiniteScrollCustomEvent } from '@ionic/angular';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import type {
  EstadoPaginaCliente,
  ReferenciaAgendamentoVisual,
} from '@app/features/pagina-cliente/contracts';
import { formatarWhatsappInternacional } from '@fluy/schema';
import { CabecalhoPublicoComponent } from '@app/features/pagina-cliente/components/cabecalho-publico/cabecalho-publico.component';
import { CatalogoProcedimentosComponent } from '@app/features/pagina-cliente/components/catalogo-procedimentos/catalogo-procedimentos.component';
import { EscolhaHorarioComponent } from '@app/features/pagina-cliente/components/escolha-horario/escolha-horario.component';
import { ConfirmacaoAgendamentoComponent } from '@app/features/pagina-cliente/components/confirmacao-agendamento/confirmacao-agendamento.component';
import { MeusAgendamentosComponent } from '@app/features/pagina-cliente/components/meus-agendamentos/meus-agendamentos.component';
import { PaginaClienteService } from '@app/features/pagina-cliente/services/pagina-cliente.service';
import { ApiError } from '@app/core/errors/api-error';
import { CentralAvisosComponent } from '@app/features/avisos/components/central-avisos/central-avisos.component';
import { CalendarioAgendamentoService } from '@app/features/avisos/services/calendario-agendamento.service';
import {
  extrairMesDaData,
  gerarGradeDoMes,
} from '@app/features/salao/agenda/agenda-utils';

@Component({
  selector: 'app-pagina-cliente-page',
  standalone: true,
  imports: [
    CabecalhoPublicoComponent,
    CatalogoProcedimentosComponent,
    EscolhaHorarioComponent,
    ConfirmacaoAgendamentoComponent,
    MeusAgendamentosComponent,
    CentralAvisosComponent,
    IonButton,
    IonCheckbox,
    IonContent,
    IonIcon,
    IonInput,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonSpinner,
    IonText,
    ReactiveFormsModule,
  ],
  templateUrl: './pagina-cliente.page.html',
  styleUrls: ['./pagina-cliente.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClientePage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly checkout = inject(CheckoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly paginaClienteService = inject(PaginaClienteService);
  private readonly calendarioService = inject(CalendarioAgendamentoService);

  private versaoPagina = 0;
  ionViewWillLeave(): void {
    this.versaoPagina++;
  }

  readonly contextosCheckout = computed(() => {
    this.checkout.contexto();
    return this.checkout.listarContextos();
  });
  retomarCheckout(id: string): void {
    void this.router.navigate(['/s', this.obterSubdominio(), 'checkout', id]);
  }

  readonly salao = this.paginaClienteService.salao;
  readonly subdominio = signal('');
  readonly credencialCliente = signal<string | null>(null);
  readonly estado = signal<EstadoPaginaCliente>('carregando');
  readonly formatarWhatsapp = formatarWhatsappInternacional;
  readonly cliente = signal<SessaoClientePublicaResponseDto['cliente']>(null);
  readonly mensagemNatashaAberta = signal(false);
  readonly identificando = signal(false);
  readonly erroIdentificacao = signal<string | null>(null);
  readonly exibirFormulario = signal(false);
  readonly exibirPrivacidade = signal(false);
  readonly catalogoAberto = signal(false);
  readonly carregandoCatalogo = signal(false);
  readonly erroCatalogo = signal<string | null>(null);
  readonly procedimentoSelecionado =
    signal<ProcedimentoPublicoResponseDto | null>(null);
  readonly procedimentos = this.paginaClienteService.procedimentos;
  readonly escolhendoHorario = signal(false);
  readonly mesDoCalendario = signal('');
  readonly diasDisponiveis = signal<string[] | null>(null);
  readonly carregandoDias = signal(false);
  readonly dataSelecionada = signal('');
  readonly horaSelecionada = signal<string | null>(null);
  readonly gradeDoCalendario = computed(() => {
    const mes = this.mesDoCalendario();
    return mes
      ? gerarGradeDoMes({ mes, diasDisponiveis: this.diasDisponiveis() })
      : [];
  });
  readonly horarios = signal<HorariosLivresResponseDto['horarios']>([]);
  readonly carregandoHorarios = signal(false);
  readonly erroHorarios = signal<string | null>(null);
  readonly revisandoAgendamento = signal(false);
  readonly salvandoAgendamento = signal(false);
  readonly erroAgendamento = signal<string | null>(null);
  readonly agendamentoCriado = signal(false);
  readonly agendamentoCriadoId = signal<string | null>(null);
  readonly baixandoCalendario = signal(false);
  readonly erroCalendario = signal<string | null>(null);
  readonly meusAgendamentosAberto = signal(false);
  readonly carregandoAgendamentos = signal(false);
  readonly erroAgendamentos = signal<string | null>(null);
  readonly detalheAgendamento =
    signal<AgendamentoPublicoDetalheResponseDto | null>(null);
  readonly carregandoDetalheAgendamento = signal(false);
  readonly referenciasDetalhe = signal<ReferenciaAgendamentoVisual[]>([]);
  readonly carregandoReferenciasDetalhe = signal(false);
  readonly erroReferenciasDetalhe = signal<string | null>(null);
  readonly confirmandoCancelamento = signal(false);
  readonly cancelandoAgendamento = signal(false);
  readonly erroCancelamento = signal<string | null>(null);
  readonly agendamentos = this.paginaClienteService.agendamentos;
  readonly fusoHorarioAgendamentos =
    this.paginaClienteService.fusoHorarioAgendamentos;
  readonly proximoCursorAgendamentos =
    this.paginaClienteService.proximoCursorAgendamentos;
  readonly dataMinima = this.obterDataLocal(new Date());

  readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true }),
    whatsapp: new FormControl('', { nonNullable: true }),
    consentimento_privacidade: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.carregarSalao();
  }

  ngOnDestroy(): void {
    this.versaoPagina++;
    this.limparReferenciasDetalhe();
  }

  recarregar(): void {
    void this.carregarSalao();
  }

  async identificar(): Promise<void> {
    const subdominio = this.obterSubdominio();
    const credencial = this.paginaClienteService.criarCredencial(subdominio);
    const resultado = identificarClientePublicaSchema.safeParse({
      ...this.formulario.getRawValue(),
      credencial,
    });

    if (!resultado.success) {
      this.erroIdentificacao.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    this.identificando.set(true);
    this.erroIdentificacao.set(null);

    try {
      const resposta = await this.paginaClienteService.identificar(
        subdominio,
        resultado.data,
      );
      this.cliente.set(resposta.cliente);
      this.mensagemNatashaAberta.set(
        this.nomeRecebeMensagemEspecial(resposta.cliente?.nome ?? ''),
      );
      this.credencialCliente.set(credencial);
      this.exibirFormulario.set(false);
    } catch {
      this.paginaClienteService.removerCredencial(subdominio);
      this.credencialCliente.set(null);
      this.erroIdentificacao.set(
        'Não foi possível continuar. Tente novamente.',
      );
    } finally {
      this.identificando.set(false);
    }
  }

  agendarComoOutraPessoa(): void {
    this.paginaClienteService.limparAgendamentos();
    this.mensagemNatashaAberta.set(false);
    this.cliente.set(null);
    this.formulario.reset();
    this.exibirFormulario.set(true);
  }

  fecharMensagemNatasha(): void {
    this.mensagemNatashaAberta.set(false);
  }

  async abrirMeusAgendamentos(): Promise<void> {
    if (!this.cliente()) return;

    this.meusAgendamentosAberto.set(true);
    this.fecharDetalheAgendamento();
    await this.carregarAgendamentos();
  }

  async abrirAgendamentoDoAviso(id: string): Promise<void> {
    await this.abrirMeusAgendamentos();
    await this.abrirDetalheAgendamento(id);
  }

  fecharMeusAgendamentos(): void {
    this.meusAgendamentosAberto.set(false);
    this.fecharDetalheAgendamento();
  }

  async carregarAgendamentos(cursor?: string): Promise<void> {
    const subdominio = this.obterSubdominio();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);

    if (!credencial) return;

    if (!cursor) {
      this.carregandoAgendamentos.set(true);
      this.erroAgendamentos.set(null);
    }

    try {
      await this.paginaClienteService.getAgendamentos(
        subdominio,
        credencial,
        cursor,
      );
    } catch {
      this.erroAgendamentos.set('Não foi possível carregar seus agendamentos.');
    } finally {
      this.carregandoAgendamentos.set(false);
    }
  }

  async carregarMaisAgendamentos(
    event: InfiniteScrollCustomEvent,
  ): Promise<void> {
    const cursor = this.proximoCursorAgendamentos();

    if (cursor) {
      await this.carregarAgendamentos(cursor);
    }

    await event.target.complete();
  }

  async abrirDetalheAgendamento(id: string): Promise<void> {
    const subdominio = this.obterSubdominio();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);

    if (!credencial) return;

    this.carregandoDetalheAgendamento.set(true);
    this.erroAgendamentos.set(null);
    this.erroCancelamento.set(null);

    try {
      const detalhe = await this.paginaClienteService.getAgendamento(
        subdominio,
        id,
        credencial,
      );
      this.detalheAgendamento.set(detalhe);
      await this.carregarReferenciasDetalhe(id, credencial);
    } catch {
      this.erroAgendamentos.set('Não foi possível abrir este agendamento.');
    } finally {
      this.carregandoDetalheAgendamento.set(false);
    }
  }

  fecharDetalheAgendamento(): void {
    this.limparReferenciasDetalhe();
    this.detalheAgendamento.set(null);
    this.confirmandoCancelamento.set(false);
    this.erroCancelamento.set(null);
  }

  private async carregarReferenciasDetalhe(
    agendamentoId: string,
    credencial: string,
  ): Promise<void> {
    this.carregandoReferenciasDetalhe.set(true);
    this.erroReferenciasDetalhe.set(null);

    try {
      const resposta = await this.paginaClienteService.listarReferencias({
        agendamentoId,
        credencial,
        subdominio: this.obterSubdominio(),
      });
      const referencias = await Promise.all(
        resposta.anexos.map(async ({ id }) => {
          const conteudo =
            await this.paginaClienteService.obterConteudoReferencia({
              agendamentoId,
              credencial,
              id,
              subdominio: this.obterSubdominio(),
            });

          return { id, url: URL.createObjectURL(conteudo) };
        }),
      );

      this.limparReferenciasDetalhe();
      this.referenciasDetalhe.set(referencias);
    } catch {
      this.erroReferenciasDetalhe.set(
        'Não foi possível carregar as imagens de referência.',
      );
    } finally {
      this.carregandoReferenciasDetalhe.set(false);
    }
  }

  private limparReferenciasDetalhe(): void {
    this.referenciasDetalhe().forEach(({ url }) => URL.revokeObjectURL(url));
    this.referenciasDetalhe.set([]);
    this.erroReferenciasDetalhe.set(null);
  }

  solicitarCancelamento(): void {
    this.confirmandoCancelamento.set(true);
    this.erroCancelamento.set(null);
  }

  desistirCancelamento(): void {
    this.confirmandoCancelamento.set(false);
  }

  async cancelarAgendamento(): Promise<void> {
    const agendamento = this.detalheAgendamento();
    const subdominio = this.obterSubdominio();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);

    if (!agendamento || !credencial) return;

    this.cancelandoAgendamento.set(true);
    this.erroCancelamento.set(null);

    try {
      const detalhe = await this.paginaClienteService.cancelarAgendamento(
        subdominio,
        agendamento.id,
        credencial,
      );
      this.detalheAgendamento.set(detalhe);
      this.confirmandoCancelamento.set(false);
    } catch {
      this.erroCancelamento.set(
        'Não foi possível cancelar. Atualize a lista e tente novamente.',
      );
    } finally {
      this.cancelandoAgendamento.set(false);
    }
  }

  async abrirCatalogo(): Promise<void> {
    if (!this.cliente()) return;

    this.catalogoAberto.set(true);

    if (this.procedimentos().length > 0) return;

    this.carregandoCatalogo.set(true);
    this.erroCatalogo.set(null);

    try {
      await this.paginaClienteService.getProcedimentos(this.obterSubdominio());
    } catch {
      this.erroCatalogo.set('Não foi possível carregar os procedimentos.');
    } finally {
      this.carregandoCatalogo.set(false);
    }
  }

  fecharCatalogo(): void {
    this.catalogoAberto.set(false);
  }

  selecionarProcedimento(procedimento: ProcedimentoPublicoResponseDto): void {
    this.procedimentoSelecionado.set(procedimento);
  }

  abrirEscolhaHorario(): void {
    if (!this.procedimentoSelecionado()) return;
    this.escolhendoHorario.set(true);
    if (!this.mesDoCalendario()) {
      this.mesDoCalendario.set(extrairMesDaData(this.dataMinima));
    }
    void this.carregarDiasDisponiveis();
  }

  async carregarDiasDisponiveis(): Promise<void> {
    const procedimento = this.procedimentoSelecionado();
    const subdominio = this.subdominio() || this.obterSubdominio();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);
    const mes = this.mesDoCalendario();

    if (!procedimento || !mes || !subdominio) return;

    this.carregandoDias.set(true);
    this.erroHorarios.set(null);

    try {
      const resposta = await this.paginaClienteService.listarDiasDisponiveis(
        subdominio,
        {
          procedimento_id: procedimento.id,
          mes,
          ...(credencial ? { credencial } : {}),
        },
      );
      this.diasDisponiveis.set(resposta.dias);

      if (resposta.dias.length > 0) {
        const dataAtual = this.dataSelecionada();
        if (!dataAtual || !resposta.dias.includes(dataAtual)) {
          void this.alterarData(resposta.dias[0]);
        }
      } else {
        this.dataSelecionada.set('');
        this.horaSelecionada.set(null);
        this.horarios.set([]);
      }
    } catch {
      this.erroHorarios.set(
        'Não foi possível carregar os dias disponíveis deste mês.',
      );
    } finally {
      this.carregandoDias.set(false);
    }
  }

  mudarMesDoCalendario(mes: string): void {
    this.mesDoCalendario.set(mes);
    void this.carregarDiasDisponiveis();
  }

  voltarAoCatalogo(): void {
    this.escolhendoHorario.set(false);
    this.horaSelecionada.set(null);
  }

  async alterarData(data: string): Promise<void> {
    const procedimento = this.procedimentoSelecionado();
    const subdominio = this.subdominio() || this.obterSubdominio();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);

    if (!procedimento || !subdominio) return;

    this.dataSelecionada.set(data);
    this.horaSelecionada.set(null);
    this.horarios.set([]);
    this.carregandoHorarios.set(true);
    this.erroHorarios.set(null);

    try {
      const resposta = await this.paginaClienteService.listarHorariosLivres(
        subdominio,
        {
          procedimento_id: procedimento.id,
          data,
          ...(credencial ? { credencial } : {}),
        },
      );
      this.horarios.set(resposta.horarios);
    } catch {
      this.erroHorarios.set(
        'Não foi possível carregar os horários desta data.',
      );
    } finally {
      this.carregandoHorarios.set(false);
    }
  }

  selecionarHora(hora: string): void {
    this.horaSelecionada.set(hora);
  }

  revisarAgendamento(): void {
    if (!this.horaSelecionada()) return;
    this.revisandoAgendamento.set(true);
    this.erroAgendamento.set(null);
  }

  voltarAoHorario(): void {
    this.revisandoAgendamento.set(false);
    this.erroAgendamento.set(null);
  }

  async confirmarAgendamento(referencias: File[]): Promise<void> {
    if (this.salvandoAgendamento() || this.agendamentoCriado()) return;
    const versao = this.versaoPagina;
    const subdominio = this.obterSubdominio();
    const procedimento = this.procedimentoSelecionado();
    const hora = this.horaSelecionada();
    const credencial = this.paginaClienteService.obterCredencial(subdominio);

    if (!procedimento || !hora || !credencial || !this.dataSelecionada())
      return;

    this.salvandoAgendamento.set(true);
    this.erroAgendamento.set(null);

    try {
      const dados = {
        credencial,
        procedimento_id: procedimento.id,
        data: this.dataSelecionada(),
        hora_inicio: hora,
        confirmar_excecoes: false,
      };
      const exigePagamento = procedimento.valor_sinal > 0;
      const agendamento = exigePagamento
        ? (
            await this.checkout.reservar({
              subdominio: subdominio,
              nomeProcedimento: procedimento.nome,
              dados,
            })
          ).reserva
        : await this.paginaClienteService.criarAgendamento(subdominio, dados);
      this.agendamentoCriadoId.set(agendamento.id);

      if (referencias.length > 0) {
        const resultados = await Promise.allSettled(
          referencias.map((arquivo) =>
            this.paginaClienteService.enviarReferencia({
              agendamentoId: agendamento.id,
              arquivo,
              credencial,
              subdominio: subdominio,
            }),
          ),
        );

        if (resultados.some((resultado) => resultado.status === 'rejected')) {
          if (exigePagamento)
            this.checkout.registrarReferenciasPendentes({
              subdominio,
              id: agendamento.id,
              pendentes: true,
            });
          this.erroAgendamento.set(
            'O agendamento foi criado, mas uma ou mais imagens não puderam ser enviadas.',
          );
        }
      }

      if (versao !== this.versaoPagina) return;
      if (exigePagamento) {
        await this.router.navigate([
          '/s',
          subdominio,
          'checkout',
          agendamento.id,
        ]);
        this.fecharAgendamentoConfirmado();
        return;
      }
      this.agendamentoCriado.set(true);
    } catch (error) {
      const mensagemApi =
        error instanceof ApiError ? this.obterMensagemApi(error) : '';

      if (error instanceof ApiError && error.status === 409) {
        if (mensagemApi.includes('já possui este procedimento')) {
          this.erroAgendamento.set(mensagemApi);
          return;
        }

        this.revisandoAgendamento.set(false);
        this.horaSelecionada.set(null);
        this.erroHorarios.set(
          'Este horário acabou de ser ocupado. Escolha outro horário.',
        );
      } else {
        this.erroAgendamento.set(
          mensagemApi ||
            'Não foi possível confirmar o agendamento. Tente novamente.',
        );
      }
    } finally {
      this.salvandoAgendamento.set(false);
    }
  }

  fecharAgendamentoConfirmado(): void {
    this.agendamentoCriado.set(false);
    this.agendamentoCriadoId.set(null);
    this.erroCalendario.set(null);
    this.revisandoAgendamento.set(false);
    this.escolhendoHorario.set(false);
    this.catalogoAberto.set(false);
    this.procedimentoSelecionado.set(null);
    this.dataSelecionada.set('');
    this.horaSelecionada.set(null);
    this.horarios.set([]);
    this.mesDoCalendario.set('');
    this.diasDisponiveis.set([]);
  }

  async baixarCalendarioCriado(): Promise<void> {
    const agendamentoId = this.agendamentoCriadoId();
    const credencial = this.credencialCliente();

    if (!agendamentoId || !credencial || this.baixandoCalendario()) return;

    this.baixandoCalendario.set(true);
    this.erroCalendario.set(null);

    try {
      await this.calendarioService.baixarPublico({
        subdominio: this.subdominio(),
        credencial,
        agendamentoId,
      });
    } catch {
      this.erroCalendario.set(
        'Não foi possível baixar o evento de calendário.',
      );
    } finally {
      this.baixandoCalendario.set(false);
    }
  }

  formatarCampoWhatsapp(valor: string | null | undefined): void {
    const digitos = (valor ?? '').replace(/\D/g, '').slice(0, 11);

    if (digitos.length === 0) {
      this.formulario.controls.whatsapp.setValue('', { emitEvent: false });
      return;
    }

    if (digitos.length <= 2) {
      this.formulario.controls.whatsapp.setValue(`(${digitos}`, {
        emitEvent: false,
      });
      return;
    }

    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);
    const tamanhoPrefixo = numero.length > 8 ? 5 : 4;
    const prefixo = numero.slice(0, tamanhoPrefixo);
    const sufixo = numero.slice(tamanhoPrefixo);
    const formatado = `(${ddd}) ${prefixo}${sufixo ? `-${sufixo}` : ''}`;

    this.formulario.controls.whatsapp.setValue(formatado, {
      emitEvent: false,
    });
  }

  private async carregarSalao(): Promise<void> {
    const subdominio = this.route.snapshot.paramMap.get('subdominio');

    if (!subdominio) {
      this.estado.set('erro');
      return;
    }

    this.subdominio.set(subdominio);
    this.paginaClienteService.salvarRotaPwa(subdominio);

    this.estado.set('carregando');

    try {
      await this.paginaClienteService.getEntidade(subdominio);
      const credencial = this.paginaClienteService.obterCredencial(subdominio);
      this.credencialCliente.set(credencial);

      if (credencial) {
        const sessao = await this.paginaClienteService.consultarSessao(
          subdominio,
          credencial,
        );
        this.cliente.set(sessao.cliente);
      }

      this.exibirFormulario.set(!this.cliente());
      this.estado.set('pronto');
    } catch {
      this.credencialCliente.set(null);
      this.estado.set('erro');
    }
  }

  private obterSubdominio(): string {
    return this.route.snapshot.paramMap.get('subdominio') ?? '';
  }

  private obterDataLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private normalizarNome(nome: string): string {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR');
  }

  private nomeRecebeMensagemEspecial(nome: string): boolean {
    const primeiroNome = this.normalizarNome(nome).split(/\s+/)[0];

    return ['na', 'nat', 'nanat', 'natasha'].includes(primeiroNome);
  }

  private obterMensagemApi(error: ApiError): string {
    if (typeof error.body !== 'object' || error.body === null) return '';

    const mensagens = (error.body as { messages?: unknown }).messages;
    return Array.isArray(mensagens) && typeof mensagens[0] === 'string'
      ? mensagens[0]
      : '';
  }
}
