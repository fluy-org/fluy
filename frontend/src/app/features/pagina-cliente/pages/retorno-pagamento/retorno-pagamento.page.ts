import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import type { RetornoPagamentoPublicoResponseDto } from '@fluy/schema';

@Component({
  selector: 'app-retorno-pagamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, IonSpinner, IonText, RouterLink],
  template: ` <ion-content class="ion-padding">
    <main>
      <h1>Consultar seu pagamento</h1>

      @if (consultando()) {
        <div class="ion-text-center ion-padding" role="status">
          <ion-spinner name="crescent"></ion-spinner>
          <p>
            <ion-text color="medium">Localizando sua reserva...</ion-text>
          </p>
        </div>
      } @else if (redirecionando()) {
        <div class="ion-text-center ion-padding" role="status">
          <ion-spinner name="crescent"></ion-spinner>
          <p>
            <ion-text color="medium"
              >Redirecionando de volta para a sua reserva...</ion-text
            >
          </p>
        </div>
      } @else if (retornoInfo(); as info) {
        <div class="ion-padding ion-text-center">
          @if (info.status === 'confirmada') {
            <h2>
              <ion-text color="success">Pagamento confirmado!</ion-text>
            </h2>
            <p>
              <ion-text>
                Seu agendamento de <strong>{{ info.procedimento?.nome }}</strong> no salão <strong>{{ info.salao?.nome }}</strong> foi confirmado com sucesso.
              </ion-text>
            </p>
          } @else if (info.status === 'pendente') {
            <h2>
              <ion-text color="warning">Pagamento em processamento</ion-text>
            </h2>
            <p>
              <ion-text>
                A autorização para <strong>{{ info.procedimento?.nome }}</strong> no salão <strong>{{ info.salao?.nome }}</strong> foi recebida e está sendo confirmada.
              </ion-text>
            </p>
          } @else {
            <h2>
              <ion-text color="medium">Situação da reserva</ion-text>
            </h2>
            <p>
              <ion-text>
                A reserva de <strong>{{ info.procedimento?.nome }}</strong> não foi confirmada dentro do prazo.
              </ion-text>
            </p>
          }
          <p>
            <ion-text color="medium">
              Você pode acompanhar todos os detalhes na conversa do WhatsApp com o salão.
            </ion-text>
          </p>
          @if (info.salao?.subdominio) {
            <ion-button [routerLink]="['/s', info.salao?.subdominio]">
              Ver salão {{ info.salao?.nome }}
            </ion-button>
          }
        </div>
      } @else {
        @if (contextos.length > 0) {
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
          }
        } @else {
          <div role="alert">
            <p>
              <ion-text color="dark">
                <strong>Abra o link do salão para ver o seu agendamento.</strong>
              </ion-text>
            </p>
            <p>
              <ion-text color="medium">
                Não encontramos uma reserva neste navegador. Se você autorizou o pagamento no aplicativo do seu banco, o salão já recebeu a confirmação. Reabra a conversa no WhatsApp para ver os detalhes do seu agendamento.
              </ion-text>
            </p>
          </div>
        }
      }
    </main>
  </ion-content>`,
})
export class RetornoPagamentoPage implements OnInit {
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly contextos = this.checkout.listarContextos();
  readonly redirecionando = signal(false);
  readonly consultando = signal(false);
  readonly retornoInfo = signal<RetornoPagamentoPublicoResponseDto | null>(null);

  async ngOnInit(): Promise<void> {
    const identificador =
      this.route.snapshot.queryParamMap.get('identificadorPagamento');

    if (identificador && this.checkout.consultarRetorno) {
      this.consultando.set(true);
      try {
        const retorno = await this.checkout.consultarRetorno(identificador);
        if (
          retorno.encontrado &&
          retorno.salao?.subdominio &&
          retorno.reserva_id
        ) {
          const temContextoLocal = this.contextos.some(
            (c) => c.reserva.id === retorno.reserva_id,
          );
          if (temContextoLocal) {
            this.redirecionando.set(true);
            await this.router.navigate([
              '/s',
              retorno.salao.subdominio,
              'checkout',
              retorno.reserva_id,
            ]);
            return;
          }

          this.retornoInfo.set(retorno);
          return;
        }
      } catch {
        // Fallback para contextos locais caso a consulta remota falhe
      } finally {
        this.consultando.set(false);
      }
    }

    if (this.contextos.length === 1) {
      const contexto = this.contextos[0];
      this.redirecionando.set(true);
      await this.router.navigate([
        '/s',
        contexto.subdominio,
        'checkout',
        contexto.reserva.id,
      ]);
    }
  }
}
