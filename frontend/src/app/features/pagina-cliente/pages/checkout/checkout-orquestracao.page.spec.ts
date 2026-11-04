import { Injector, runInInjectionContext, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CheckoutPage } from './checkout.page';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import { PaginaClienteService } from '@app/features/pagina-cliente/services/pagina-cliente.service';
import { CalendarioAgendamentoService } from '@app/features/avisos/services/calendario-agendamento.service';

describe('Checkout: isolamento da orquestração da página', () => {
  const contexto = signal<unknown>({
    subdominio: 'antigo',
    reserva: { id: 'reserva-antiga' },
  });
  const pagamento = signal<unknown>({ status: 'confirmada' });
  let checkout: {
    contexto: typeof contexto;
    pagamento: typeof pagamento;
    instituicoes: ReturnType<typeof signal<never[]>>;
    erroConsulta: ReturnType<typeof signal<null>>;
    limparContexto: jasmine.Spy;
    parar: jasmine.Spy;
    iniciar: jasmine.Spy;
    acompanhar: jasmine.Spy;
    registrarReferenciasPendentes: jasmine.Spy;
  };
  let pagina: jasmine.SpyObj<PaginaClienteService>;
  let page: CheckoutPage;
  beforeEach(() => {
    contexto.set({ subdominio: 'antigo', reserva: { id: 'reserva-antiga' } });
    pagamento.set({ status: 'confirmada' });
    checkout = {
      contexto,
      pagamento,
      instituicoes: signal<never[]>([]),
      erroConsulta: signal(null),
      limparContexto: jasmine.createSpy().and.callFake(() => {
        contexto.set(null);
        pagamento.set(null);
      }),
      parar: jasmine.createSpy(),
      iniciar: jasmine.createSpy(),
      acompanhar: jasmine.createSpy(),
      registrarReferenciasPendentes: jasmine.createSpy(),
    };
    pagina = jasmine.createSpyObj('PaginaClienteService', [
      'obterCredencial',
      'getEntidade',
      'enviarReferencia',
    ]);
    pagina.getEntidade.and.resolveTo({ nome: 'Novo salão' } as never);
    page = runInInjectionContext(
      Injector.create({
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: CheckoutService, useValue: checkout },
          { provide: PaginaClienteService, useValue: pagina },
          { provide: CalendarioAgendamentoService, useValue: {} },
        ],
      }),
      () => new CheckoutPage(),
    );
    page.subdominio.set('novo');
    page.id.set('reserva-nova');
  });
  it('não mantém pagamento de outro salão quando falta identificação', async () => {
    pagina.obterCredencial.and.returnValue(null);
    await page.carregar();
    expect(page.contexto()).toBeNull();
    expect(page.pagamento()).toBeNull();
    expect(page.erro()).toContain('Identificação ausente');
  });
  it('não reinicia polling quando a iniciação termina depois de sair', async () => {
    let concluir!: () => void;
    checkout.iniciar.and.returnValue(
      new Promise<void>((resolve) => {
        concluir = resolve;
      }),
    );
    page.instituicoesCarregadas.set(true);
    const operacao = page.iniciar();
    page.ionViewWillLeave();
    concluir();
    await operacao;
    expect(checkout.acompanhar).not.toHaveBeenCalled();
  });
  it('não grava aviso de upload antigo no contexto da próxima reserva', async () => {
    pagina.obterCredencial.and.returnValue('credencial');
    let concluir!: (value: never) => void;
    pagina.enviarReferencia.and.returnValue(
      new Promise((resolve) => {
        concluir = resolve;
      }),
    );
    const operacao = page.enviarReferencias({
      target: {
        files: [new File(['x'], 'foto.png', { type: 'image/png' })],
        value: '',
      },
    } as unknown as Event);
    page.ionViewWillLeave();
    page.id.set('reserva-outra');
    concluir({} as never);
    await operacao;
    expect(checkout.registrarReferenciasPendentes).toHaveBeenCalledWith({
      subdominio: 'novo',
      id: 'reserva-nova',
      pendentes: false,
    });
    expect(page.avisoReferencias()).toBeNull();
  });
});
