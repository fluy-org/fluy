import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  type ProcedimentoPublicoResponseDto,
  type HorariosLivresResponseDto,
  identificarClientePublicaSchema,
  type SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import type { EstadoPaginaCliente } from '@app/features/pagina-cliente/contracts';
import { formatarWhatsappInternacional } from '@fluy/schema';
import { CabecalhoPublicoComponent } from '@app/features/pagina-cliente/components/cabecalho-publico/cabecalho-publico.component';
import { CatalogoProcedimentosComponent } from '@app/features/pagina-cliente/components/catalogo-procedimentos/catalogo-procedimentos.component';
import { EscolhaHorarioComponent } from '@app/features/pagina-cliente/components/escolha-horario/escolha-horario.component';
import { ConfirmacaoAgendamentoComponent } from '@app/features/pagina-cliente/components/confirmacao-agendamento/confirmacao-agendamento.component';
import { PaginaClienteService } from '@app/features/pagina-cliente/services/pagina-cliente.service';
import { ApiError } from '@app/core/errors/api-error';

@Component({
  selector: 'app-pagina-cliente-page',
  standalone: true,
  imports: [
    CabecalhoPublicoComponent,
    CatalogoProcedimentosComponent,
    EscolhaHorarioComponent,
    ConfirmacaoAgendamentoComponent,
    IonButton,
    IonCheckbox,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
    IonText,
    ReactiveFormsModule,
  ],
  templateUrl: './pagina-cliente.page.html',
  styleUrls: ['./pagina-cliente.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClientePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paginaClienteService = inject(PaginaClienteService);

  readonly salao = this.paginaClienteService.salao;
  readonly estado = signal<EstadoPaginaCliente>('carregando');
  readonly formatarWhatsapp = formatarWhatsappInternacional;
  readonly cliente = signal<SessaoClientePublicaResponseDto['cliente']>(null);
  readonly identificando = signal(false);
  readonly erroIdentificacao = signal<string | null>(null);
  readonly exibirFormulario = signal(false);
  readonly exibirPrivacidade = signal(false);
  readonly catalogoAberto = signal(false);
  readonly carregandoCatalogo = signal(false);
  readonly erroCatalogo = signal<string | null>(null);
  readonly procedimentoSelecionado = signal<ProcedimentoPublicoResponseDto | null>(null);
  readonly procedimentos = this.paginaClienteService.procedimentos;
  readonly escolhendoHorario = signal(false);
  readonly dataSelecionada = signal('');
  readonly horaSelecionada = signal<string | null>(null);
  readonly horarios = signal<HorariosLivresResponseDto['horarios']>([]);
  readonly carregandoHorarios = signal(false);
  readonly erroHorarios = signal<string | null>(null);
  readonly revisandoAgendamento = signal(false);
  readonly salvandoAgendamento = signal(false);
  readonly erroAgendamento = signal<string | null>(null);
  readonly agendamentoCriado = signal(false);
  readonly dataMinima = this.obterDataLocal(new Date());

  readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true }),
    whatsapp: new FormControl('', { nonNullable: true }),
    consentimento_privacidade: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.carregarSalao();
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
      this.exibirFormulario.set(false);
    } catch {
      this.paginaClienteService.removerCredencial(subdominio);
      this.erroIdentificacao.set('Não foi possível continuar. Tente novamente.');
    } finally {
      this.identificando.set(false);
    }
  }

  agendarComoOutraPessoa(): void {
    this.cliente.set(null);
    this.formulario.reset();
    this.exibirFormulario.set(true);
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
  }

  voltarAoCatalogo(): void {
    this.escolhendoHorario.set(false);
    this.horaSelecionada.set(null);
  }

  async alterarData(data: string): Promise<void> {
    const procedimento = this.procedimentoSelecionado();
    const credencial = this.paginaClienteService.obterCredencial(
      this.obterSubdominio(),
    );

    if (!procedimento || !credencial) return;

    this.dataSelecionada.set(data);
    this.horaSelecionada.set(null);
    this.horarios.set([]);
    this.carregandoHorarios.set(true);
    this.erroHorarios.set(null);

    try {
      const resposta = await this.paginaClienteService.listarHorariosLivres(
        this.obterSubdominio(),
        {
          procedimento_id: procedimento.id,
          data,
          credencial,
        },
      );
      this.horarios.set(resposta.horarios);
    } catch {
      this.erroHorarios.set('Não foi possível carregar os horários desta data.');
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

  async confirmarAgendamento(): Promise<void> {
    const procedimento = this.procedimentoSelecionado();
    const hora = this.horaSelecionada();
    const credencial = this.paginaClienteService.obterCredencial(
      this.obterSubdominio(),
    );

    if (!procedimento || !hora || !credencial || !this.dataSelecionada()) return;

    this.salvandoAgendamento.set(true);
    this.erroAgendamento.set(null);

    try {
      await this.paginaClienteService.criarAgendamento(
        this.obterSubdominio(),
        {
          credencial,
          procedimento_id: procedimento.id,
          data: this.dataSelecionada(),
          hora_inicio: hora,
          confirmar_excecoes: false,
        },
      );
      this.agendamentoCriado.set(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const mensagem = this.obterMensagemApi(error);

        if (mensagem.includes('já possui este procedimento')) {
          this.erroAgendamento.set(mensagem);
          return;
        }

        this.revisandoAgendamento.set(false);
        this.horaSelecionada.set(null);
        this.erroHorarios.set(
          'Este horário acabou de ser ocupado. Escolha outro horário.',
        );
      } else {
        this.erroAgendamento.set(
          'Não foi possível confirmar o agendamento. Tente novamente.',
        );
      }
    } finally {
      this.salvandoAgendamento.set(false);
    }
  }

  fecharAgendamentoConfirmado(): void {
    this.agendamentoCriado.set(false);
    this.revisandoAgendamento.set(false);
    this.escolhendoHorario.set(false);
    this.catalogoAberto.set(false);
    this.procedimentoSelecionado.set(null);
    this.dataSelecionada.set('');
    this.horaSelecionada.set(null);
    this.horarios.set([]);
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

    this.estado.set('carregando');

    try {
      await this.paginaClienteService.getEntidade(subdominio);
      const credencial = this.paginaClienteService.obterCredencial(subdominio);

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

  private obterMensagemApi(error: ApiError): string {
    if (typeof error.body !== 'object' || error.body === null) return '';

    const mensagens = (error.body as { messages?: unknown }).messages;
    return Array.isArray(mensagens) && typeof mensagens[0] === 'string'
      ? mensagens[0]
      : '';
  }
}
