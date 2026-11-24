import { ErroCheckout } from '@app/features/pagina-cliente/contracts';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { iniciarPagamentoPixSchema, pagadorPixSchema } from '@fluy/schema';
import type {
  SalaoPublicoResponseDto,
  ProcedimentoPublicoResponseDto,
  IniciarPagamentoPixDto,
} from '@fluy/schema';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronForwardOutline,
  closeCircleOutline,
  closeOutline,
  informationCircleOutline,
  logoWhatsapp,
  refreshOutline,
  searchOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import { FieldErrorComponent } from '@app/shared/components/field-error/field-error.component';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import { PaginaClienteService } from '@app/features/pagina-cliente/services/pagina-cliente.service';
import { CalendarioAgendamentoService } from '@app/features/avisos/services/calendario-agendamento.service';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import { zodValidator } from '@app/shared/utils/zod-validator';
import { ApiError } from '@app/core/errors/api-error';
import { formatarCpf, limparCpf, validarCpf } from '@app/shared/utils/cpf';

const TERMOS_BANCOS_MAIS_USADOS = [
  'nubank',
  'banco do brasil',
  'bradesco',
  'itau',
  'itaú',
  'caixa',
  'santander',
  'inter',
  'c6',
  'pagbank',
  'mercado pago',
  'picpay',
  'sicoob',
  'sicredi',
];

function validadorCpfCustomizado(
  control: AbstractControl,
): ValidationErrors | null {
  const valor = control.value as string | null | undefined;
  if (!valor) return null;
  const limpo = limparCpf(valor);
  if (limpo.length === 0) return null;
  if (limpo.length !== 11 || !validarCpf(limpo)) {
    return { cpfInvalido: 'Informe um CPF válido com 11 dígitos.' };
  }
  return null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    HoraSalaoPipe,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    FieldErrorComponent,
  ],
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit, OnDestroy {
  constructor() {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      arrowForwardOutline,
      calendarOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      chevronForwardOutline,
      closeCircleOutline,
      closeOutline,
      informationCircleOutline,
      logoWhatsapp,
      refreshOutline,
      searchOutline,
      timeOutline,
      walletOutline,
    });
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkout = inject(CheckoutService);
  private readonly pagina = inject(PaginaClienteService);
  private readonly calendario = inject(CalendarioAgendamentoService);
  private readonly ngZone = inject(NgZone);

  readonly contexto = this.checkout.contexto;
  readonly pagamento = this.checkout.pagamento;
  readonly instituicoes = this.checkout.instituicoes;
  readonly erroConsulta = this.checkout.erroConsulta;

  readonly salao = signal<SalaoPublicoResponseDto | null>(null);
  readonly procedimento = signal<ProcedimentoPublicoResponseDto | null>(null);
  readonly recebedor = signal('');
  readonly carregando = signal(true);
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroInstituicoes = signal<string | null>(null);
  readonly instituicoesCarregadas = signal(false);
  readonly avisoReferencias = signal<string | null>(null);
  readonly subdominio = signal('');
  readonly id = signal('');

  readonly modalBancoAberto = signal(false);
  readonly termoBuscaBanco = signal('');

  // Signals reativos para controle de UI (garantindo ChangeDetection OnPush)
  readonly modalidadeSelecionada = signal<
    IniciarPagamentoPixDto['modalidade']
  >('sinal');
  readonly bancoIdSelecionado = signal<string>('');

  readonly segundosRestantes = signal<number | null>(null);
  readonly reservaExpirada = computed(() => {
    const s = this.segundosRestantes();
    return s !== null && s <= 0;
  });

  readonly formatacaoPrazoRestante = computed(() => {
    const s = this.segundosRestantes();
    if (s === null || s <= 0) return '00:00';
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  private intervaloContagem: ReturnType<typeof setInterval> | undefined;
  private parametros: Subscription | undefined;
  private versaoTela = 0;
  private visivel = true;

  readonly contato = computed(() => {
    const numero = this.salao()?.contato_whatsapp.replace(/\D/g, '');
    return numero ? 'https://wa.me/' + numero : null;
  });

  readonly urlAutorizacao = computed(() => {
    const pagamento = this.pagamento();
    if (
      pagamento?.status !== 'pendente' ||
      pagamento.situacao !== 'normal' ||
      !pagamento.instrucao_cliente
    )
      return null;
    try {
      const url = new URL(pagamento.instrucao_cliente.valor);
      return url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  });

  readonly formulario = new FormGroup({
    modalidade: new FormControl<IniciarPagamentoPixDto['modalidade']>('sinal', {
      nonNullable: true,
      validators: zodValidator(iniciarPagamentoPixSchema.shape.modalidade),
    }),
    pagador: new FormGroup({
      cpf: new FormControl('', {
        nonNullable: true,
        validators: [validadorCpfCustomizado],
      }),
      instituicao_id: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(pagadorPixSchema.shape.instituicao_id),
      }),
    }),
  });

  readonly valorPagarAgora = computed(() => {
    const contexto = this.contexto();
    if (!contexto) return 0;
    const modalidade = this.modalidadeSelecionada();
    return modalidade === 'sinal'
      ? contexto.reserva.valor_sinal
      : contexto.reserva.preco_total;
  });

  readonly valorNoSalao = computed(() => {
    const contexto = this.contexto();
    if (!contexto) return 0;
    const modalidade = this.modalidadeSelecionada();
    return modalidade === 'sinal'
      ? Math.max(0, contexto.reserva.preco_total - contexto.reserva.valor_sinal)
      : 0;
  });

  readonly bancoSelecionado = computed(() => {
    const id = this.bancoIdSelecionado();
    if (!id) return null;
    return this.instituicoes().find((b) => b.id === id) ?? null;
  });

  readonly bancosMaisUsados = computed(() => {
    const lista = this.instituicoes();
    return lista.filter((banco) => {
      const nomeLimpo = banco.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return TERMOS_BANCOS_MAIS_USADOS.some((termo) =>
        nomeLimpo.includes(termo),
      );
    });
  });

  readonly outrosBancos = computed(() => {
    const maisUsadosIds = new Set(this.bancosMaisUsados().map((b) => b.id));
    return this.instituicoes().filter((b) => !maisUsadosIds.has(b.id));
  });

  readonly bancosFiltrados = computed(() => {
    const termo = this.termoBuscaBanco().trim().toLowerCase();
    const lista = this.instituicoes();
    if (!termo) return this.outrosBancos();
    const termoSemAcento = termo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return lista.filter((banco) => {
      const nomeSemAcento = banco.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return nomeSemAcento.includes(termoSemAcento);
    });
  });

  ngOnInit(): void {
    this.parametros = this.route.paramMap.subscribe((parametros) => {
      this.checkout.parar();
      this.subdominio.set(parametros.get('subdominio') ?? '');
      this.id.set(parametros.get('id') ?? '');
      void this.carregar();
    });
  }

  ngOnDestroy(): void {
    this.versaoTela++;
    this.parametros?.unsubscribe();
    this.pararContagemRegressiva();
    this.checkout.parar();
  }

  ionViewWillLeave(): void {
    this.visivel = false;
    this.versaoTela++;
    this.pararContagemRegressiva();
    this.checkout.parar();
  }

  ionViewDidEnter(): void {
    if (!this.visivel) {
      this.visivel = true;
      void this.carregar();
    }
  }

  async carregar(): Promise<void> {
    const versao = ++this.versaoTela;
    const subdominio = this.subdominio();
    const id = this.id();
    this.checkout.limparContexto();
    this.pararContagemRegressiva();
    this.formulario.reset({
      modalidade: 'sinal',
      pagador: { cpf: '', instituicao_id: '' },
    });
    this.modalidadeSelecionada.set('sinal');
    this.bancoIdSelecionado.set('');
    this.enviando.set(false);
    this.instituicoesCarregadas.set(false);
    this.salao.set(null);
    this.procedimento.set(null);
    this.recebedor.set('');
    this.erroInstituicoes.set(null);
    this.avisoReferencias.set(null);
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const credencial = this.pagina.obterCredencial(this.subdominio());
      const salao = await this.pagina.getEntidade(subdominio);
      if (versao !== this.versaoTela) return;
      this.salao.set(salao);

      if (!credencial)
        throw new ErroCheckout(
          'Identificação ausente. Volte à página do salão. Se já autorizou o pagamento, fale com o salão antes de pagar novamente.',
        );

      try {
        await this.checkout.retomar({ subdominio, id, credencial });
      } catch (erro) {
        if (!this.contexto()) throw erro;
        this.mostrarErro(erro);
      }

      if (versao !== this.versaoTela) return;
      const contexto = this.contexto();

      this.avisoReferencias.set(
        contexto?.referenciasPendentes
          ? 'Algumas imagens de referência não foram enviadas na revisão. Você poderá adicioná-las nos detalhes do seu agendamento em "Meus agendamentos".'
          : null,
      );

      if (contexto?.tentativa) {
        this.formulario.controls.modalidade.setValue(contexto.tentativa);
        this.modalidadeSelecionada.set(contexto.tentativa);
      }

      if (contexto) {
        if (contexto.reserva.expira_em) {
          this.iniciarContagemRegressiva(contexto.reserva.expira_em);
        }
        try {
          const recebedor = await this.checkout.consultarRecebedor();
          if (versao !== this.versaoTela) return;
          this.recebedor.set(recebedor.nome_recebedor);
        } catch (erro) {
          if (!(erro instanceof ApiError)) throw erro;
          if (versao === this.versaoTela) this.erro.set(erro.message);
        }

        await this.carregarInstituicoes();
        if (versao !== this.versaoTela) return;

        try {
          const catalogo = await this.pagina.getProcedimentos(
            this.subdominio(),
          );
          if (versao !== this.versaoTela) return;
          this.procedimento.set(
            catalogo.find(
              (item) => item.id === contexto.reserva.procedimento_id,
            ) ?? null,
          );
        } catch (erro) {
          if (!(erro instanceof ApiError)) throw erro;
        }

        if (contexto.tentativa) this.checkout.acompanhar();
      }
    } catch (erro) {
      if (versao === this.versaoTela) this.mostrarErro(erro);
    } finally {
      if (versao === this.versaoTela) this.carregando.set(false);
    }
  }

  async carregarInstituicoes(): Promise<void> {
    const versao = this.versaoTela;
    this.erroInstituicoes.set(null);
    this.instituicoesCarregadas.set(false);
    try {
      await this.checkout.carregarInstituicoes();
      if (versao === this.versaoTela) this.instituicoesCarregadas.set(true);
    } catch (erro) {
      if (!(erro instanceof ApiError)) throw erro;
      if (versao !== this.versaoTela) return;
      this.erroInstituicoes.set(
        'Não foi possível carregar os bancos disponíveis. Tente recarregar.',
      );
    }
  }

  alterarModalidade(valor: IniciarPagamentoPixDto['modalidade']): void {
    this.modalidadeSelecionada.set(valor);
    this.formulario.controls.modalidade.setValue(valor);
  }

  formatarCpfAoDigitar(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const formatado = formatarCpf(input.value);
    input.value = formatado;
    this.formulario.controls.pagador.controls.cpf.setValue(formatado);
  }

  abrirModalBanco(): void {
    this.termoBuscaBanco.set('');
    this.modalBancoAberto.set(true);
  }

  fecharModalBanco(): void {
    this.modalBancoAberto.set(false);
  }

  atualizarBuscaBanco(valor: string | null | undefined): void {
    this.termoBuscaBanco.set(valor ?? '');
  }

  selecionarBanco(id: string): void {
    this.bancoIdSelecionado.set(id);
    this.formulario.controls.pagador.controls.instituicao_id.setValue(id);
    this.formulario.controls.pagador.controls.instituicao_id.markAsTouched();
    this.fecharModalBanco();
  }

  async iniciar(): Promise<void> {
    if (this.enviando() || !this.instituicoesCarregadas()) return;
    const versao = this.versaoTela;
    this.erro.set(null);
    this.formulario.markAllAsTouched();

    const dados = this.formulario.getRawValue();
    const cpfLimpo = limparCpf(dados.pagador.cpf);

    if (this.instituicoes().length) {
      if (!dados.pagador.instituicao_id) {
        this.erro.set('Selecione o seu banco para pagar com Pix.');
        return;
      }
      if (!validarCpf(cpfLimpo)) {
        this.erro.set('Informe um CPF válido.');
        return;
      }
    }

    const modalidade = this.contexto()?.tentativa ?? dados.modalidade;
    const pagador = this.instituicoes().length
      ? {
          cpf: cpfLimpo,
          instituicao_id: dados.pagador.instituicao_id,
        }
      : undefined;

    this.enviando.set(true);
    try {
      await this.checkout.iniciar({
        modalidade,
        ...(pagador ? { pagador } : {}),
      });

      if (versao === this.versaoTela && this.visivel) {
        this.checkout.acompanhar();
        // Redireciona imediatamente para o banco assim que a URL estiver disponível
        const url = this.urlAutorizacao();
        if (url) {
          window.location.assign(url);
        }
      }
    } catch (erro) {
      if (versao === this.versaoTela) this.mostrarErro(erro);
    } finally {
      if (versao === this.versaoTela) this.enviando.set(false);
    }
  }

  async atualizar(): Promise<void> {
    if (this.enviando()) return;
    const versao = this.versaoTela;
    this.enviando.set(true);
    this.erro.set(null);
    try {
      await this.checkout.consultar();
    } catch (erro) {
      if (versao === this.versaoTela) this.mostrarErro(erro);
    } finally {
      if (versao === this.versaoTela) this.enviando.set(false);
    }
  }

  async baixarCalendario(): Promise<void> {
    const credencial = this.pagina.obterCredencial(this.subdominio());
    if (
      !credencial ||
      this.pagamento()?.status !== 'confirmada' ||
      this.pagamento()?.situacao !== 'normal'
    )
      return;
    try {
      await this.calendario.baixarPublico({
        subdominio: this.subdominio(),
        credencial,
        agendamentoId: this.id(),
      });
    } catch (erro) {
      this.mostrarErro(erro);
    }
  }

  private iniciarContagemRegressiva(expiraEmIso: string): void {
    this.pararContagemRegressiva();
    const atualizar = () => {
      const agora = Date.now();
      const fim = new Date(expiraEmIso).getTime();
      if (!Number.isFinite(fim)) {
        this.segundosRestantes.set(0);
        return;
      }
      const restoSegundos = Math.max(0, Math.floor((fim - agora) / 1000));
      this.segundosRestantes.set(restoSegundos);
      if (restoSegundos <= 0) {
        this.pararContagemRegressiva();
        this.checkout.removerContexto({
          subdominio: this.subdominio(),
          id: this.id(),
        });
      }
    };
    atualizar();
    if ((this.segundosRestantes() ?? 0) > 0) {
      this.ngZone.runOutsideAngular(() => {
        this.intervaloContagem = setInterval(() => {
          this.ngZone.run(() => atualizar());
        }, 1000);
      });
    }
  }

  private pararContagemRegressiva(): void {
    if (this.intervaloContagem !== undefined) {
      clearInterval(this.intervaloContagem);
      this.intervaloContagem = undefined;
    }
  }

  async descartarReserva(): Promise<void> {
    const subdominio = this.subdominio();
    const id = this.id();
    const credencial = this.pagina.obterCredencial(subdominio);
    this.enviando.set(true);
    try {
      if (credencial && id) {
        await this.pagina.cancelarAgendamento(subdominio, id, credencial);
      }
    } catch {
      // Ignora erro se a reserva já tiver sido encerrada ou cancelada
    } finally {
      this.checkout.removerContexto({ subdominio, id });
      this.enviando.set(false);
      await this.router.navigate(['/s', subdominio]);
    }
  }

  async escolherNovoHorario(): Promise<void> {
    const subdominio = this.subdominio();
    const id = this.id();
    this.checkout.removerContexto({ subdominio, id });
    await this.router.navigate(['/s', subdominio]);
  }

  private mostrarErro(erro: unknown): void {
    if (erro instanceof ApiError || erro instanceof ErroCheckout)
      this.erro.set(erro.message);
    else throw erro;
  }
}
