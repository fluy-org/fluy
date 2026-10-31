import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonText } from '@ionic/angular/standalone';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';

@Component({
  selector: 'app-retorno-pagamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, IonText, RouterLink],
  template: ` <ion-content class="ion-padding">
    <main>
      <h1>Consultar seu pagamento</h1>
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
    </main>
  </ion-content>`,
})
export class RetornoPagamentoPage {
  private readonly checkout = inject(CheckoutService);
  readonly contextos = this.checkout.listarContextos();
}
