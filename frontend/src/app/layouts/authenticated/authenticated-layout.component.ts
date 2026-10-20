import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterLink,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '@app/core/services/auth/auth.service';
import { CentralAvisosComponent } from '@app/features/avisos/components/central-avisos/central-avisos.component';

@Component({
  selector: 'app-authenticated-layout',
  templateUrl: './authenticated-layout.component.html',
  styleUrls: ['./authenticated-layout.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterLink,
    IonRouterOutlet,
    IonSplitPane,
    IonTitle,
    IonToolbar,
    RouterLink,
    CentralAvisosComponent,
  ],
})
export class AuthenticatedLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly saindo = signal(false);

  async sair(): Promise<void> {
    if (this.saindo()) {
      return;
    }

    this.saindo.set(true);

    try {
      await this.authService.logout();
    } finally {
      this.saindo.set(false);
    }
  }
}
