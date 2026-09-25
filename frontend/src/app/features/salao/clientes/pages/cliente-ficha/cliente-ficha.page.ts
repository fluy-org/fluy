import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ClienteFichaResponseDto, CriarClienteDto } from '@fluy/schema';
import {
  AlertController,
  InfiniteScrollCustomEvent,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonRouterLink,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { ApiError } from '@app/core/errors/api-error';
import { FormularioClienteComponent } from '@app/features/salao/clientes/components/formulario-cliente/formulario-cliente.component';
import { HistoricoAgendamentosComponent } from '@app/features/salao/clientes/components/historico-agendamentos/historico-agendamentos.component';
import { MetricasClienteComponent } from '@app/features/salao/clientes/components/metricas-cliente/metricas-cliente.component';
import type { EstadoPaginaFicha } from '@app/features/salao/clientes/contracts';
import { ClientesService } from '@app/features/salao/clientes/services/clientes.service';
import {
  formatarWhatsapp,
  normalizarWhatsapp,
} from '@app/shared/utils/formatacao';

@Component({
  selector: 'app-cliente-ficha',
  templateUrl: './cliente-ficha.page.html',
  styleUrls: ['./cliente-ficha.page.scss'],
  standalone: true,
  imports: [
    FormularioClienteComponent,
    HistoricoAgendamentosComponent,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonRouterLink,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    MetricasClienteComponent,
    RouterLink,
  ],
})
export class ClienteFichaPage implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly alertController = inject(AlertController);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly ficha = this.clientesService.ficha;
  readonly agendamentos = this.clientesService.agendamentos;
  readonly proximoCursorAgendamentos =
    this.clientesService.proximoCursorAgendamentos;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);
  readonly formularioAberto = signal(false);
  readonly salvando = signal(false);
  readonly erroFormulario = signal<string | null>(null);

  readonly estadoPagina = computed<EstadoPaginaFicha>(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    return this.erro() ? 'erro' : 'ficha';
  });

  readonly whatsapp = computed(() => {
    const ficha = this.ficha();

    return ficha ? formatarWhatsapp(ficha.whatsapp) : '';
  });

  constructor() {
    addIcons({ arrowBack });
  }

  ngOnInit(): void {
    void this.carregar();
  }

  recarregar(): void {
    void this.carregar();
  }

  async carregarMaisAgendamentos(
    evento: InfiniteScrollCustomEvent,
  ): Promise<void> {
    const ficha = this.ficha();
    const cursor = this.proximoCursorAgendamentos();

    try {
      if (ficha && cursor) {
        await this.clientesService.getAgendamentos(ficha.id, cursor);
      }
    } catch (error) {
      this.tratarErroAcao(error, 'Não foi possível carregar o histórico.');
    } finally {
      await evento.target.complete();
    }
  }

  abrirAgendamento(id: string): void {
    void this.router.navigate(['/painel/agenda', id]);
  }

  criarAgendamento(): void {
    const ficha = this.ficha();

    if (!ficha?.ativo) {
      return;
    }

    void this.router.navigate(['/painel/agenda/novo'], {
      queryParams: { cliente_id: ficha.id },
    });
  }

  abrirFormulario(): void {
    this.erroFormulario.set(null);
    this.formularioAberto.set(true);
  }

  fecharFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formularioAberto.set(false);
    this.erroFormulario.set(null);
  }

  async salvarCliente(dados: CriarClienteDto): Promise<void> {
    const ficha = this.ficha();

    if (!ficha) {
      return;
    }

    // Cadastros antigos podem guardar o número em outro formato (ex.: +55...);
    // a comparação é pelo número normalizado, não pelo texto salvo.
    const whatsappMudou = dados.whatsapp !== normalizarWhatsapp(ficha.whatsapp);

    if (whatsappMudou) {
      const trocaConfirmada = await this.confirmarTrocaWhatsapp(
        ficha,
        dados.whatsapp,
      );

      if (!trocaConfirmada) {
        return;
      }
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    try {
      await this.clientesService.updateEntidade(ficha.id, {
        nome: dados.nome,
        // O formulário omite observação vazia; na edição, vazio significa apagar.
        observacoes: dados.observacoes ?? null,
        ...(whatsappMudou ? { whatsapp: dados.whatsapp } : {}),
      });
      this.formularioAberto.set(false);
    } catch (error) {
      this.erroFormulario.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar o cliente.',
      );
    } finally {
      this.salvando.set(false);
    }
  }

  async confirmarInativacao(): Promise<void> {
    const ficha = this.ficha();

    if (!ficha) {
      return;
    }

    const alerta = await this.alertController.create({
      header: 'Inativar cliente',
      message: `Deseja inativar ${ficha.nome}? O histórico continua preservado.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Inativar', role: 'confirm' },
      ],
    });

    await alerta.present();
    const resultado = await alerta.onDidDismiss();

    if (resultado.role !== 'confirm') {
      return;
    }

    this.erroAcao.set(null);

    try {
      await this.clientesService.inativarEntidade(ficha.id);
    } catch (error) {
      this.tratarErroAcao(error, 'Não foi possível inativar o cliente.');
    }
  }

  async reativar(): Promise<void> {
    const ficha = this.ficha();

    if (!ficha) {
      return;
    }

    this.erroAcao.set(null);

    try {
      await this.clientesService.reativarEntidade(ficha.id);
    } catch (error) {
      this.tratarErroAcao(error, 'Não foi possível reativar o cliente.');
    }
  }

  private async confirmarTrocaWhatsapp(
    ficha: ClienteFichaResponseDto,
    novoWhatsapp: string,
  ): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: 'Trocar WhatsApp',
      message: `O WhatsApp identifica ${ficha.nome} no salão. Deseja trocar ${formatarWhatsapp(ficha.whatsapp)} por ${formatarWhatsapp(novoWhatsapp)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Trocar', role: 'confirm' },
      ],
    });

    await alerta.present();
    const resultado = await alerta.onDidDismiss();

    return resultado.role === 'confirm';
  }

  private async carregar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    try {
      await Promise.all([
        this.clientesService.getEntidade(id),
        this.clientesService.getAgendamentos(id),
      ]);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erro.set(error.message);
    } finally {
      this.carregando.set(false);
    }
  }

  private tratarErroAcao(error: unknown, mensagemPadrao: string): void {
    this.erroAcao.set(
      error instanceof ApiError ? error.message : mensagemPadrao,
    );
  }
}
