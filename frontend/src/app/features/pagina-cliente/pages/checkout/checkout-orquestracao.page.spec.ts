import { Injector, NgZone, runInInjectionContext, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
          {
            provide: Router,
            useValue: { navigate: jasmine.createSpy().and.resolveTo(true) },
          },
          {
            provide: NgZone,
            useValue: new NgZone({ enableLongStackTrace: false }),
          },
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
  it('rejeita CPF inválido sem chamar checkout.iniciar', async () => {
    checkout.instituicoes.set([{ id: 'banco-1', nome: 'Nubank' }] as never);
    page.instituicoesCarregadas.set(true);
    page.formulario.controls.pagador.controls.instituicao_id.setValue('banco-1');
    page.formulario.controls.pagador.controls.cpf.setValue('123.456.789-00'); // CPF matematicamente inválido

    await page.iniciar();

    expect(checkout.iniciar).not.toHaveBeenCalled();
    expect(page.erro()).toBe('Informe um CPF válido.');
  });

  it('filtra bancos corretamente e destaca mais usados', () => {
    checkout.instituicoes.set([
      { id: '1', nome: 'Nubank' },
      { id: '2', nome: 'Banco do Brasil' },
      { id: '3', nome: 'Cooperativa de Crédito Regional' },
    ] as never);

    expect(page.bancosMaisUsados().map((b) => b.id)).toEqual(['1', '2']);

    page.atualizarBuscaBanco('regional');
    expect(page.bancosFiltrados().map((b) => b.id)).toEqual(['3']);
  });
});
