import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import type {
  CriarProcedimentoDto,
  ProcedimentoResponseDto,
} from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ApiError } from '../../../../../core/errors/api-error';
import { HeaderComponent } from '../../../../../shared/components/header/header.component';
import { FormularioProcedimentoComponent } from '../../components/formulario-procedimento/formulario-procedimento.component';
import { ProcedimentosService } from '../../services/procedimentos.service';

@Component({
  selector: 'app-procedimentos',
  templateUrl: './procedimentos.page.html',
  styleUrls: ['./procedimentos.page.scss'],
  standalone: true,
  imports: [
    HeaderComponent,
    FormularioProcedimentoComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
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
export class ProcedimentosPage implements OnInit {
  private procedimentosService = inject(ProcedimentosService);

  readonly procedimentos = this.procedimentosService.procedimentos;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly formularioAberto = signal(false);
  readonly procedimentoEmEdicao = signal<ProcedimentoResponseDto | null>(null);
  readonly salvandoFormulario = signal(false);
  readonly erroFormulario = signal<string | null>(null);
  readonly procedimentoAlterandoStatusId = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);
  readonly termoPesquisa = signal('');
  readonly filtroStatus = signal<'todos' | 'ativos' | 'inativos'>('todos');

  // Mantem a lista original no service e deriva somente o que deve aparecer.
  readonly procedimentosFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.termoPesquisa());
    const status = this.filtroStatus();

    return this.procedimentos().filter((procedimento) => {
      const correspondeAoStatus =
        status === 'todos' ||
        (status === 'ativos' && procedimento.ativo) ||
        (status === 'inativos' && !procedimento.ativo);
      const conteudoPesquisavel = this.normalizarTexto(
        `${procedimento.nome} ${procedimento.descricao ?? ''}`,
      );

      return correspondeAoStatus && conteudoPesquisavel.includes(termo);
    });
  });

  // Centraliza no TypeScript a decisao de qual estado visual a pagina deve exibir.
  readonly estadoPagina = computed(() => {
    if (this.carregando()) {
      return 'carregando';
    }

    if (this.erro()) {
      return 'erro';
    }

    if (this.procedimentos().length === 0) {
      return 'vazio';
    }

    return this.procedimentosFiltrados().length === 0
      ? 'sem-resultados'
      : 'lista';
  });

  ngOnInit(): void {
    void this.carregar();
  }

  atualizarPesquisa(valor: string | null | undefined): void {
    this.termoPesquisa.set(valor?.trim() ?? '');
  }

  atualizarFiltroStatus(valor: string | null | undefined): void {
    if (valor === 'ativos' || valor === 'inativos') {
      this.filtroStatus.set(valor);
      return;
    }

    this.filtroStatus.set('todos');
  }

  abrirFormulario(procedimento: ProcedimentoResponseDto | null = null): void {
    // Sem procedimento abre em criacao; com procedimento abre preenchido para edicao.
    this.procedimentoEmEdicao.set(procedimento);
    this.erroFormulario.set(null);
    this.formularioAberto.set(true);
  }

  fecharFormulario(): void {
    if (this.salvandoFormulario()) {
      return;
    }

    this.erroFormulario.set(null);
    this.procedimentoEmEdicao.set(null);
    this.formularioAberto.set(false);
  }

  aoFecharFormulario(): void {
    // Sincroniza o signal quando o usuario fecha o modal por gesto ou backdrop.
    this.erroFormulario.set(null);
    this.procedimentoEmEdicao.set(null);
    this.formularioAberto.set(false);
  }

  async confirmarFormulario(dados: CriarProcedimentoDto): Promise<void> {
    if (this.salvandoFormulario()) {
      return;
    }

    this.salvandoFormulario.set(true);
    this.erroFormulario.set(null);

    try {
      // A page orquestra a mutacao; o componente cuida somente do formulario.
      const procedimento = this.procedimentoEmEdicao();

      if (procedimento) {
        await this.procedimentosService.updateEntidade(procedimento.id, dados);
      } else {
        await this.procedimentosService.setEntidade(dados);
      }

      this.formularioAberto.set(false);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroFormulario.set(error.message);
    } finally {
      this.salvandoFormulario.set(false);
    }
  }

  async alterarStatus(procedimento: ProcedimentoResponseDto): Promise<void> {
    if (this.procedimentoAlterandoStatusId()) {
      return;
    }

    this.procedimentoAlterandoStatusId.set(procedimento.id);
    this.erroAcao.set(null);

    try {
      if (procedimento.ativo) {
        // DELETE representa inativacao no dominio; o registro nao e removido.
        await this.procedimentosService.deleteEntidade(procedimento.id);
      } else {
        await this.procedimentosService.updateEntidade(procedimento.id, {
          ativo: true,
        });
      }
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroAcao.set(error.message);
    } finally {
      this.procedimentoAlterandoStatusId.set(null);
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.procedimentosService.getLista();
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
    // Permite encontrar, por exemplo, "coloracao" ao pesquisar "Coloração".
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }
}
