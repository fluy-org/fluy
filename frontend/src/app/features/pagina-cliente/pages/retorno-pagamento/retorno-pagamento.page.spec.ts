import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RetornoPagamentoPage } from './retorno-pagamento.page';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import type { ContextoCheckout } from '@app/features/pagina-cliente/contracts';

describe('RetornoPagamentoPage (TDD)', () => {
  let fixture: ComponentFixture<RetornoPagamentoPage>;
  let router: Router;
  let mockCheckoutService: {
    listarContextos: jasmine.Spy;
    consultarRetorno?: jasmine.Spy;
  };
  let queryParamMapStub: ReturnType<typeof convertToParamMap>;

  const criarContexto = (id: string, subdominio: string, procedimento: string): ContextoCheckout => ({
    subdominio,
    vinculo: 'a'.repeat(64),
    nomeProcedimento: procedimento,
    reserva: {
      id,
      profissional_id: 'prof-1',
      cliente_id: 'cli-1',
      procedimento_id: 'proc-1',
      inicio_em: '2030-01-01T10:00:00.000Z',
      duracao_min: 30,
      preco_total: 100,
      valor_sinal: 20,
      estado: 'reservado',
      criado_em: '2030-01-01T09:45:00.000Z',
      expira_em: '2030-01-01T10:15:00.000Z',
    },
  });

  beforeEach(async () => {
    queryParamMapStub = convertToParamMap({});
    mockCheckoutService = {
      listarContextos: jasmine.createSpy('listarContextos').and.returnValue([]),
      consultarRetorno: jasmine.createSpy('consultarRetorno'),
    };

    await TestBed.configureTestingModule({
      imports: [RetornoPagamentoPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParamMapStub.get(key),
              },
            },
          },
        },
        { provide: CheckoutService, useValue: mockCheckoutService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('deve exibir confirmação na tela quando identificadorPagamento for reconhecido em navegador diferente (sem contexto local)', async () => {
    queryParamMapStub = convertToParamMap({
      identificadorPagamento: 'urn:efi:12345',
    });
    mockCheckoutService.listarContextos.and.returnValue([]);
    mockCheckoutService.consultarRetorno!.and.resolveTo({
      encontrado: true,
      reserva_id: 'reserva-999',
      status: 'confirmada',
      procedimento: { nome: 'Corte Degradê' },
      salao: { nome: 'Salão Bella', subdominio: 'salao-bella' },
    });

    fixture = TestBed.createComponent(RetornoPagamentoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).not.toHaveBeenCalled();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Pagamento confirmado!');
    expect(texto).toContain('Corte Degradê');
    expect(texto).toContain('Salão Bella');
  });

  it('deve redirecionar para o checkout quando identificadorPagamento for reconhecido no mesmo navegador (com contexto local)', async () => {
    const contextoLocal = criarContexto('reserva-999', 'salao-bella', 'Corte Degradê');
    queryParamMapStub = convertToParamMap({
      identificadorPagamento: 'urn:efi:12345',
    });
    mockCheckoutService.listarContextos.and.returnValue([contextoLocal]);
    mockCheckoutService.consultarRetorno!.and.resolveTo({
      encontrado: true,
      reserva_id: 'reserva-999',
      status: 'confirmada',
      procedimento: { nome: 'Corte Degradê' },
      salao: { nome: 'Salão Bella', subdominio: 'salao-bella' },
    });

    fixture = TestBed.createComponent(RetornoPagamentoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith([
      '/s',
      'salao-bella',
      'checkout',
      'reserva-999',
    ]);
  });

  it('deve redirecionar automaticamente para a tela de checkout quando houver exatamente um contexto salvo', async () => {
    const contextoUnico = criarContexto('reserva-123', 'salao-teste', 'Corte de Cabelo');
    mockCheckoutService.listarContextos.and.returnValue([contextoUnico]);

    fixture = TestBed.createComponent(RetornoPagamentoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith([
      '/s',
      'salao-teste',
      'checkout',
      'reserva-123',
    ]);

    const statusEl = fixture.debugElement.query(By.css('[role="status"]'));
    expect(statusEl).toBeTruthy();
    expect(statusEl.nativeElement.textContent).toContain('Redirecionando de volta para a sua reserva...');
  });

  it('não deve redirecionar e deve listar os botões de retorno quando houver múltiplos contextos salvos', async () => {
    const contexto1 = criarContexto('reserva-1', 'salao-a', 'Corte');
    const contexto2 = criarContexto('reserva-2', 'salao-b', 'Barba');
    mockCheckoutService.listarContextos.and.returnValue([contexto1, contexto2]);

    fixture = TestBed.createComponent(RetornoPagamentoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).not.toHaveBeenCalled();

    const botoes = fixture.debugElement.queryAll(By.css('ion-button'));
    expect(botoes.length).toBe(2);
    expect(botoes[0].nativeElement.textContent).toContain('Corte — salao-a');
    expect(botoes[1].nativeElement.textContent).toContain('Barba — salao-b');
  });

  it('não deve redirecionar e deve exibir mensagem de alerta quando não houver nenhum contexto salvo', async () => {
    mockCheckoutService.listarContextos.and.returnValue([]);

    fixture = TestBed.createComponent(RetornoPagamentoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).not.toHaveBeenCalled();

    const alerta = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alerta).toBeTruthy();
    expect(alerta.nativeElement.textContent).toContain('Não encontramos uma reserva neste navegador');
  });
});
