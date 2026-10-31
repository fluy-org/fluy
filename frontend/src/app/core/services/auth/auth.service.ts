import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Clerk } from '@clerk/clerk-js';
import type {
  CadastroPorConvitePreparado,
  ConcluirCadastroPorConviteInput,
} from '@app/features/auth/contracts';
import { environment } from '../../../../environments/environment';
import { loadClerkUi } from './clerk-ui.loader';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private clerk: Clerk | null = null;
  private emailConvitePreparado: string | null = null;
  private unsubscribeFromClerk: (() => void) | null = null;

  readonly isAuthenticated = signal(false);

  async initialize(): Promise<void> {
    this.unsubscribeFromClerk?.();
    this.unsubscribeFromClerk = null;

    if (!environment.clerkPublishableKey) {
      this.isAuthenticated.set(false);
      return;
    }

    this.clerk = new Clerk(environment.clerkPublishableKey);
    await this.clerk.load({
      ui: await loadClerkUi(environment.clerkPublishableKey),
    });
    this.syncAuthentication();
    this.unsubscribeFromClerk = this.clerk.addListener(() =>
      this.syncAuthentication(),
    );
  }

  async getToken(): Promise<string | null> {
    return this.clerk?.session?.getToken() ?? null;
  }

  async iniciarLogin(returnUrl: string): Promise<void> {
    const retornoLogin = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;

    await this.getClerk().redirectToSignIn({
      signInFallbackRedirectUrl: retornoLogin,
      signInForceRedirectUrl: retornoLogin,
    });
  }

  async prepararCadastroPorConvite(
    ticket: string,
  ): Promise<CadastroPorConvitePreparado> {
    const signUpResource = this.getClerk().client?.signUp;

    if (!signUpResource) {
      throw new Error('O Clerk ainda não está pronto para validar o convite.');
    }

    const signUp = await signUpResource.create({
      strategy: 'ticket',
      ticket,
    });

    if (!signUp.emailAddress) {
      throw new Error('O convite não definiu um e-mail para o cadastro.');
    }

    this.emailConvitePreparado = normalizarEmail(signUp.emailAddress);

    return { email: signUp.emailAddress };
  }

  async concluirCadastroPorConvite(
    input: ConcluirCadastroPorConviteInput,
  ): Promise<void> {
    const clerk = this.getClerk();
    const signUpResource = clerk.client?.signUp;

    if (!signUpResource || !this.emailConvitePreparado) {
      throw new Error('O convite precisa ser validado novamente.');
    }

    this.validarEmailDoConvite(signUpResource.emailAddress);

    const signUp = await signUpResource.update({
      firstName: input.nome.trim(),
      lastName: input.sobrenome.trim(),
      password: input.senha,
    });

    this.validarEmailDoConvite(signUp.emailAddress);

    if (signUp.status !== 'complete' || !signUp.createdSessionId) {
      throw new Error(
        'O Clerk ainda precisa de informações para concluir o cadastro.',
      );
    }

    await clerk.setActive({ session: signUp.createdSessionId });
    this.emailConvitePreparado = null;
    this.syncAuthentication();
  }

  async logout(): Promise<void> {
    await this.clerk?.signOut();
    this.emailConvitePreparado = null;
    this.isAuthenticated.set(false);
    await this.router.navigate(['/login']);
  }

  handleUnauthorized(): void {
    this.isAuthenticated.set(false);

    if (!this.router.url.startsWith('/login')) {
      void this.router.navigate(['/login']);
    }
  }

  private getClerk(): Clerk {
    if (!this.clerk) {
      throw new Error('Clerk nao esta configurado.');
    }

    return this.clerk;
  }

  private syncAuthentication(): void {
    this.isAuthenticated.set(this.clerk?.isSignedIn ?? false);
  }

  private validarEmailDoConvite(email: string | null): void {
    if (!email || normalizarEmail(email) !== this.emailConvitePreparado) {
      throw new Error(
        'A identidade do cadastro não corresponde ao e-mail convidado.',
      );
    }
  }
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
