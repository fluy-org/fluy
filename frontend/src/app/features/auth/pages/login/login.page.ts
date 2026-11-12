import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ApiError } from '@app/core/errors/api-error';
import { AuthService } from '@app/core/services/auth/auth.service';
import { ContaService } from '@app/features/auth/services/conta.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [IonContent, IonHeader, IonSpinner, IonText, IonTitle, IonToolbar],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly contaService = inject(ContaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('clerkSignInHost')
  private clerkSignInHost?: ElementRef<HTMLDivElement>;

  private loginMontado = false;
  private direcionandoConta = false;

  readonly verificandoConta = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      // Ao autenticar no componente embutido do Clerk (ou retornar logado), verifica a conta local.
      if (this.authService.isAuthenticated() && !this.direcionandoConta) {
        this.direcionandoConta = true;
        this.desmontarFormularioLogin();
        void this.direcionarContaAutenticada();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.authService.isAuthenticated()) {
      return;
    }

    const host = this.clerkSignInHost?.nativeElement;
    if (!host) {
      return;
    }

    const montado = this.authService.montarLogin({
      container: host,
      returnUrl: this.returnUrl,
    });
    if (!montado) {
      this.errorMessage.set('Nao foi possivel carregar o formulario de login.');
      return;
    }

    this.loginMontado = true;
  }

  ngOnDestroy(): void {
    this.desmontarFormularioLogin();
  }

  private desmontarFormularioLogin(): void {
    if (!this.loginMontado || !this.clerkSignInHost) {
      return;
    }

    this.authService.desmontarLogin(this.clerkSignInHost.nativeElement);
    this.loginMontado = false;
  }

  private async direcionarContaAutenticada(): Promise<void> {
    this.verificandoConta.set(true);
    this.errorMessage.set('');

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

      this.errorMessage.set(error.message);
      this.verificandoConta.set(false);
      this.direcionandoConta = false;
    }
  }

  private get returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value?.startsWith('/painel') ? value : '/painel/agenda';
  }
}
