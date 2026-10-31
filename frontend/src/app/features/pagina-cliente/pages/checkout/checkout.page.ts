import { ErroCheckout } from '@app/features/pagina-cliente/contracts';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cloudUploadOutline,
  informationCircleOutline,
  logoWhatsapp,
  refreshOutline,
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
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      cloudUploadOutline,
      informationCircleOutline,
      logoWhatsapp,
      refreshOutline,
      timeOutline,
      walletOutline,
    });
  }
  private readonly route = inject(ActivatedRoute);
  private readonly checkout = inject(CheckoutService);
  private readonly pagina = inject(PaginaClienteService);
  private readonly calendario = inject(CalendarioAgendamentoService);
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
  readonly formulario = new FormGroup(
    {
      modalidade: new FormControl<IniciarPagamentoPixDto['modalidade']>(
        'sinal',
        {
          nonNullable: true,
          validators: zodValidator(iniciarPagamentoPixSchema.shape.modalidade),
        },
      ),
      pagador: new FormGroup(
        {
          cpf: new FormControl('', {
            nonNullable: true,
            validators: zodValidator(pagadorPixSchema.shape.cpf),
          }),
          instituicao_id: new FormControl('', {
            nonNullable: true,
            validators: zodValidator(pagadorPixSchema.shape.instituicao_id),
          }),
        },
        { validators: zodValidator(pagadorPixSchema) },
      ),
    },
    {
      validators: zodValidator(
        iniciarPagamentoPixSchema.omit({ credencial: true }),
      ),
    },
  );
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
    this.checkout.parar();
  }
  ionViewWillLeave(): void {
    this.visivel = false;
    this.versaoTela++;
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
    this.formulario.reset({
      modalidade: 'sinal',
      pagador: { cpf: '', instituicao_id: '' },
    });
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
          ? 'Algumas imagens da reserva não foram enviadas. Selecione novamente apenas as que faltam.'
          : null,
      );
      if (contexto?.tentativa)
        this.formulario.controls.modalidade.setValue(contexto.tentativa);
      if (contexto) {
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
        'Não foi possível carregar as instituições. Tente novamente.',
      );
    }
  }

  async iniciar(): Promise<void> {
    if (this.enviando() || !this.instituicoesCarregadas()) return;
    const versao = this.versaoTela;
    this.erro.set(null);
    this.formulario.markAllAsTouched();
    const dados = this.formulario.getRawValue();
    const pagador = this.instituicoes().length ? dados.pagador : undefined;
    const resultado = iniciarPagamentoPixSchema
      .omit({ credencial: true })
      .safeParse({
        modalidade: this.contexto()?.tentativa ?? dados.modalidade,
        ...(pagador ? { pagador } : {}),
      });
    if (!resultado.success) {
      const issue = resultado.error.issues[0];
      const mensagem =
        issue?.path.includes('instituicao_id')
          ? 'Selecione o banco de quem vai pagar.'
          : issue?.path.includes('cpf')
            ? 'Informe um CPF válido com 11 dígitos (somente números).'
            : issue?.message ?? 'Revise os dados de pagamento.';
      this.erro.set(mensagem);
      return;
    }
    this.enviando.set(true);
    try {
      await this.checkout.iniciar(resultado.data);
      if (versao === this.versaoTela && this.visivel)
        this.checkout.acompanhar();
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

  async enviarReferencias(evento: Event): Promise<void> {
    const versao = this.versaoTela;
    const subdominio = this.subdominio();
    const id = this.id();
    const input = evento.target as HTMLInputElement;
    const arquivos = Array.from(input.files ?? []);
    input.value = '';
    const credencial = this.pagina.obterCredencial(this.subdominio());
    if (!credencial || this.enviando()) return;
    this.enviando.set(true);
    this.avisoReferencias.set(null);
    try {
      const resultados = await Promise.allSettled(
        arquivos.map((arquivo) =>
          this.pagina.enviarReferencia({
            subdominio,
            credencial,
            agendamentoId: id,
            arquivo,
          }),
        ),
      );
      this.checkout.registrarReferenciasPendentes({
        subdominio,
        id,
        pendentes: resultados.some((r) => r.status === 'rejected'),
      });
      if (versao !== this.versaoTela) return;
      this.avisoReferencias.set(
        resultados.some((r) => r.status === 'rejected')
          ? 'Algumas imagens não foram enviadas. Selecione novamente as imagens que faltam.'
          : 'Imagens enviadas.',
      );
    } finally {
      if (versao === this.versaoTela) this.enviando.set(false);
    }
  }

  private mostrarErro(erro: unknown): void {
    if (erro instanceof ApiError || erro instanceof ErroCheckout)
      this.erro.set(erro.message);
    else throw erro;
  }
}
