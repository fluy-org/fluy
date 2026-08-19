import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonText, IonTitle, IonToolbar],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  isSubmitting = false;
  errorMessage = '';

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

  private get returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value?.startsWith('/painel') ? value : '/painel/agenda';
  }
}
