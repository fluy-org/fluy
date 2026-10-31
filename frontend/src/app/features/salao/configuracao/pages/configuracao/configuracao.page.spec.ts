import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiErrorInterceptor } from '@app/core/interceptors/api-error.interceptor';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ConfiguracaoPage } from './configuracao.page';

describe('Recebimento Pix na configuração', () => {
  it('oferece cadastro de chave sem prometer conta verificada', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const fixture = TestBed.createComponent(ConfiguracaoPage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .match(() => true)
      .forEach((req) => {
        if (req.request.url.endsWith('recebimento-pix')) {
          req.flush(
            { messages: ['Recebimento Pix não cadastrado.'] },
            { status: 404, statusText: 'Not Found' },
          );
        } else {
          req.flush({
            granularidade_min: 30,
            prazo_reserva_min: 15,
            tolerancia_atraso_min: 15,
            antecedencia_min_horas: 2,
            antecedencia_max_dias: 60,
            mensagem_confirmacao: null,
            politica_atraso: null,
          });
        }
      });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.recebimentoCarregado()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Recebimento Pix');
    expect(fixture.nativeElement.textContent).not.toContain('Conta verificada');
  });
});
