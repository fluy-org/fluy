import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import type {
  AtualizarClienteDto,
  ClienteResponseDto,
  CriarClienteDto,
  StatusFiltroCliente,
} from '@fluy/schema';
import { ApiError } from '@app/core/errors/api-error';
import { FormularioClienteComponent } from '@app/features/salao/clientes/components/formulario-cliente/formulario-cliente.component';
import { ClientesService } from '@app/features/salao/clientes/services/clientes.service';
import { HeaderComponent } from '@app/shared/components/header/header.component';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [
    FormularioClienteComponent,
    HeaderComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonModal,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
  ],
})
export class ClientesPage implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly alertController = inject(AlertController);

  readonly clientes = this.clientesService.clientes;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly termoPesquisa = signal('');
  readonly statusSelecionado = signal<StatusFiltroCliente>('ativos');
  readonly formularioAberto = signal(false);
  readonly clienteEmEdicao = signal<ClienteResponseDto | null>(null);
  readonly salvandoCliente = signal(false);
  readonly erroFormulario = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);

  readonly clientesFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.termoPesquisa());

    return this.clientes().filter((cliente) => {
      const conteudoPesquisavel = this.normalizarTexto(
        `${cliente.nome} ${cliente.whatsapp}`,
      );

      return conteudoPesquisavel.includes(termo);
    });
  });

  readonly estadoPagina = computed(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.erro()) {
      return 'erro';
    }

    if (this.clientes().length === 0) {
      return 'vazio';
    }

    return this.clientesFiltrados().length === 0
      ? 'sem-resultados'
      : 'lista';
  });

  ngOnInit(): void {
    void this.carregar();
  }

  atualizarPesquisa(valor: string | null | undefined): void {
    this.termoPesquisa.set(valor?.trim() ?? '');
  }

  async alterarStatus(status: StatusFiltroCliente): Promise<void> {
    this.statusSelecionado.set(status);
    await this.carregar();
  }

  formatarWhatsapp(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    const tamanhoPrefixo = digitos.length === 11 ? 5 : 4;
    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);
    const prefixo = numero.slice(0, tamanhoPrefixo);
    const sufixo = numero.slice(tamanhoPrefixo);

    return `(${ddd}) ${prefixo}${sufixo ? `-${sufixo}` : ''}`;
  }

  abrirFormulario(): void {
    this.clienteEmEdicao.set(null);
    this.erroFormulario.set(null);
    this.formularioAberto.set(true);
  }

  editarCliente(cliente: ClienteResponseDto): void {
    this.clienteEmEdicao.set(cliente);
    this.erroFormulario.set(null);
    this.formularioAberto.set(true);
  }

  fecharFormulario(): void {
    if (this.salvandoCliente()) {
      return;
    }

    this.formularioAberto.set(false);
    this.clienteEmEdicao.set(null);
    this.erroFormulario.set(null);
  }

  async salvarCliente(dados: CriarClienteDto): Promise<void> {
    this.salvandoCliente.set(true);
    this.erroFormulario.set(null);

    try {
      const cliente = this.clienteEmEdicao();

      if (cliente) {
        await this.clientesService.updateEntidade(
          cliente.id,
          dados as AtualizarClienteDto,
        );
      } else {
        await this.clientesService.setEntidade(dados);
      }

      this.formularioAberto.set(false);
    } catch (error) {
      this.erroFormulario.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível cadastrar o cliente.',
      );
    } finally {
      this.salvandoCliente.set(false);
    }
  }

  async confirmarInativacao(cliente: ClienteResponseDto): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Inativar cliente',
      message: `Deseja inativar ${cliente.nome}?`,
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
      await this.clientesService.inativarEntidade(cliente.id);
    } catch (error) {
      this.erroAcao.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível inativar o cliente.',
      );
    }
  }

  async reativarCliente(cliente: ClienteResponseDto): Promise<void> {
    this.erroAcao.set(null);

    try {
      await this.clientesService.reativarEntidade(cliente.id);
    } catch (error) {
      this.erroAcao.set(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível reativar o cliente.',
      );
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.clientesService.getLista(this.statusSelecionado());
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erro.set(error.message);
    } finally {
      this.carregando.set(false);
    }
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }
}
