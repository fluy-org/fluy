import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-cadastro-page',
  standalone: true,
  imports: [IonContent, IonHeader, IonText, IonTitle, IonToolbar],
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
})
export class CadastroPage implements AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private clerkCadastro =
    viewChild.required<ElementRef<HTMLDivElement>>('clerkCadastro');
  private clerkElement: HTMLDivElement | null = null;

  readonly errorMessage = signal('');

  async ngAfterViewInit(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      await this.router.navigate(['/concluir-cadastro']);
      return;
    }

    try {
      this.clerkElement = this.clerkCadastro().nativeElement;
      this.authService.montarCadastro(this.clerkElement);
    } catch (error) {
      console.log(error);
      this.errorMessage.set(
        'Nao foi possivel carregar o cadastro. Tente novamente mais tarde.',
      );
    }
  }

  ngOnDestroy(): void {
    if (this.clerkElement) {
      this.authService.desmontarCadastro(this.clerkElement);
    }
  }
}
