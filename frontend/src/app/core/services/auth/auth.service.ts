import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Clerk } from '@clerk/clerk-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private clerk: Clerk | null = null;

  readonly isAuthenticated = signal(false);

  async initialize(): Promise<void> {
    if (!environment.clerkPublishableKey) {
      this.isAuthenticated.set(false);
      return;
    }

    this.clerk = new Clerk(environment.clerkPublishableKey);
    await this.clerk.load();
    this.isAuthenticated.set(this.clerk.isSignedIn);
  }

  async getToken(): Promise<string | null> {
    return this.clerk?.session?.getToken() ?? null;
  }

  async iniciarLogin(returnUrl: string): Promise<void> {
    if (!this.clerk) {
      throw new Error('Clerk nao esta configurado.');
    }

    await this.clerk.redirectToSignIn({ fallbackRedirectUrl: returnUrl });
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
}
