import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Clerk } from '@clerk/clerk-js';
import { environment } from '../../../../environments/environment';
import { loadClerkUi } from './clerk-ui.loader';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private clerk: Clerk | null = null;
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
    await this.clerk.load({ ui: await loadClerkUi(environment.clerkPublishableKey) });
    this.syncAuthentication();
    this.unsubscribeFromClerk = this.clerk.addListener(() =>
      this.syncAuthentication(),
    );
  }

  async getToken(): Promise<string | null> {
    return this.clerk?.session?.getToken() ?? null;
  }

  async iniciarLogin(returnUrl: string): Promise<void> {
    await this.getClerk().redirectToSignIn({ signInFallbackRedirectUrl: returnUrl });
  }

  montarCadastro(element: HTMLDivElement): void {
    this.getClerk().mountSignUp(element, {
      forceRedirectUrl: '/concluir-cadastro',
      signInUrl: '/login',
    });
  }

  desmontarCadastro(element: HTMLDivElement): void {
    this.clerk?.unmountSignUp(element);
  }

  async logout(): Promise<void> {
    await this.clerk?.signOut();
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
}
