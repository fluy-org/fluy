import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';

@Component({
  selector: 'app-retorno-pagamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, IonSpinner, IonText, RouterLink],
  template: ` <ion-content class="ion-padding">
    <main>
      <h1>Consultar seu pagamento</h1>

      @if (redirecionando()) {
        <div class="ion-text-center ion-padding" role="status">
          <ion-spinner name="crescent"></ion-spinner>
          <p>
            <ion-text color="medium"
              >Redirecionando de volta para a sua reserva...</ion-text
            >
          </p>
        </div>
      } @else {
        <ion-text
          >O retorno do banco não confirma o pagamento. Retome sua reserva para
          consultar a situação.</ion-text
        >
        @for (contexto of contextos; track contexto.reserva.id) {
          <ion-button
            [routerLink]="[
              '/s',
              contexto.subdominio,
              'checkout',
              contexto.reserva.id,
            ]"
            >Retomar {{ contexto.nomeProcedimento }} —
            {{ contexto.subdominio }}</ion-button
          >
        } @empty {
          <ion-text role="alert"
            >Não encontramos uma reserva neste navegador. Volte à página do salão
            usando o mesmo dispositivo e navegador em que iniciou. Se você já
            autorizou, fale com o salão antes de pagar novamente.</ion-text
          >
        }
      }
    </main>
  </ion-content>`,
})
export class RetornoPagamentoPage implements OnInit {
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);

  readonly contextos = this.checkout.listarContextos();
  readonly redirecionando = signal(false);

  ngOnInit(): void {
    if (this.contextos.length === 1) {
      const contexto = this.contextos[0];
      this.redirecionando.set(true);
      void this.router.navigate([
        '/s',
        contexto.subdominio,
        'checkout',
        contexto.reserva.id,
      ]);
    }
  }
}
