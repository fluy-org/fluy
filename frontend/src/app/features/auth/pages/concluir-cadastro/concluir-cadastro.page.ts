import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import type { TipoErroConclusaoCadastro } from '../../contracts';
import { ContaService } from '../../services/conta.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

type AcaoErroConclusaoCadastro = 'sair_e_entrar' | 'tentar_novamente';

interface ErroExibivelConclusaoCadastro {
  titulo: string;
  descricao: string;
  textoBotao: string;
  acao: AcaoErroConclusaoCadastro;
}

const ERROS_EXIBIVEIS_CONCLUSAO_CADASTRO: Record<
  TipoErroConclusaoCadastro,
  ErroExibivelConclusaoCadastro
> = {
  conflito_email: {
    titulo: 'Este e-mail ja pertence a outra conta',
    descricao: 'Entre com a identidade usada originalmente para acessar essa conta.',
    textoBotao: 'Sair e entrar novamente',
    acao: 'sair_e_entrar',
  },
  perfil_incompleto: {
    titulo: 'Conclua seu perfil no Clerk',
    descricao:
      'Nome, sobrenome e e-mail primario verificado sao necessarios para continuar.',
    textoBotao: 'Tentar novamente',
    acao: 'tentar_novamente',
  },
  temporario: {
    titulo: 'Nao foi possivel concluir seu cadastro',
    descricao: 'Verifique sua conexao e tente novamente.',
    textoBotao: 'Tentar novamente',
    acao: 'tentar_novamente',
  },
};

@Component({
  selector: 'app-concluir-cadastro-page',
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './concluir-cadastro.page.html',
  styleUrls: ['./concluir-cadastro.page.scss'],
})
export class ConcluirCadastroPage implements OnInit {
  private contaService = inject(ContaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly submitting = signal(false);
  readonly erroExibivel = signal<ErroExibivelConclusaoCadastro | null>(null);

  ngOnInit(): void {
    void this.materializar();
  }

  async materializar(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.erroExibivel.set(null);

    try {
      await this.contaService.materializar();
      await this.router.navigate(['/onboarding'], { replaceUrl: true });
    } catch (error) {
      const tipoErro = this.identificarTipoErro(error);
      this.erroExibivel.set(ERROS_EXIBIVEIS_CONCLUSAO_CADASTRO[tipoErro]);
    } finally {
      this.submitting.set(false);
    }
  }

  async sairEEntrar(): Promise<void> {
    await this.authService.logout();
  }

  async executarAcaoErro(): Promise<void> {
    if (this.erroExibivel()?.acao === 'sair_e_entrar') {
      await this.sairEEntrar();
      return;
    }

    await this.materializar();
  }

  private identificarTipoErro(error: unknown): TipoErroConclusaoCadastro {
    if (!(error instanceof HttpErrorResponse)) {
      return 'temporario';
    }

    if (error.status === 409) {
      return 'conflito_email';
    }

    if (error.status === 422) {
      return 'perfil_incompleto';
    }

    return 'temporario';
  }
}
