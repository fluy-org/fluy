import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiError } from '../../../../core/errors/api-error';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ContaService } from '../../services/conta.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonSpinner, IonText, IonTitle, IonToolbar],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private authService = inject(AuthService);
  private contaService = inject(ContaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isSubmitting = false;
  verificandoConta = false;
  errorMessage = '';

  ngOnInit(): void {
    // Ao retornar do Clerk, a sessao ja existe e precisamos descobrir o estado da conta local.
    if (this.authService.isAuthenticated()) {
      void this.direcionarContaAutenticada();
    }
  }

  async iniciarLogin(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.iniciarLogin(this.returnUrl);
    } catch {
      this.errorMessage = 'Nao foi possivel iniciar o login.';
      this.isSubmitting = false;
    }
  }

  private async direcionarContaAutenticada(): Promise<void> {
    // Este estado diferencia o retorno do Clerk do clique que inicia o login.
    this.verificandoConta = true;
    this.errorMessage = '';

    try {
      const conta = await this.contaService.consultarAtual();

      // Uma conta sem vinculo com salao deve concluir o onboarding antes de acessar o painel.
      const destino =
        conta.estado === 'sem-salao' ? '/onboarding' : this.returnUrl;

      await this.router.navigateByUrl(destino, { replaceUrl: true });
    } catch (error) {
      // O 404 significa que o Clerk autenticou, mas o usuario ainda nao foi materializado na API.
      if (error instanceof ApiError && error.status === 404) {
        await this.router.navigate(['/concluir-cadastro'], {
          replaceUrl: true,
        });
        return;
      }

      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.errorMessage = error.message;
      this.verificandoConta = false;
    }
  }

  private get returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value?.startsWith('/painel') ? value : '/painel/agenda';
  }
}
