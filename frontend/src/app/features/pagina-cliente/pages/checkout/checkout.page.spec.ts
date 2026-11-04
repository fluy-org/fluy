import { By } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { CheckoutPage } from './checkout.page';
import { CheckoutService } from '@app/features/pagina-cliente/services/checkout.service';
import { PaginaClienteService } from '@app/features/pagina-cliente/services/pagina-cliente.service';
import { CalendarioAgendamentoService } from '@app/features/avisos/services/calendario-agendamento.service';
import type { PagamentoPixResponseDto } from '@fluy/schema';

describe('Checkout: estados apresentados', () => {
  const reserva = {
    id: '01010101-0101-4010-8010-010101010101',
    inicio_em: '2030-01-02T13:00:00.000Z',
    expira_em: '2030-01-01T00:15:00.000Z',
    preco_total: 100,
    valor_sinal: 25,
    procedimento_id: 'procedimento-a',
  };
  const pagamentoInicial: PagamentoPixResponseDto = {
    id: reserva.id,
    nome_recebedor: 'Recebedor congelado',
    status: 'pendente',
    modalidade: 'sinal',
    valor_salao: 25,
    taxa_cliente: 1,
    total_cliente: 26,
    expira_em: reserva.expira_em,
    situacao: 'normal',
    instrucao_cliente: {
      tipo: 'url',
      valor: 'https://banco.example/autorizar',
    },
  };
  const pagamento = signal(pagamentoInicial);
  const retomar = jasmine.createSpy().and.resolveTo();
  beforeEach(() => {
    pagamento.set(pagamentoInicial);
    retomar.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({ subdominio: 'salao-a', id: reserva.id }),
            ),
            snapshot: {
              paramMap: convertToParamMap({
                subdominio: 'salao-a',
                id: reserva.id,
              }),
              queryParamMap: convertToParamMap({
                sucesso: 'true',
                identificadorPagamento: 'adulterado',
              }),
            },
          },
        },
        {
          provide: CheckoutService,
          useValue: {
            contexto: signal({
              subdominio: 'salao-a',
              reserva,
              nomeProcedimento: 'Corte',
              tentativa: 'sinal',
            }),
            pagamento,
            instituicoes: signal([]),
            erroConsulta: signal(null),
            retomar,
            limparContexto: () => {},
            consultarRecebedor: async () => ({
              nome_recebedor: 'Recebedor atual',
            }),
            carregarInstituicoes: async () => {},
            acompanhar: () => {},
            parar: () => {},
          },
        },
        {
          provide: PaginaClienteService,
          useValue: {
            obterCredencial: () => 'credencial-local',
            getEntidade: async () => ({
              nome: 'Salão',
              endereco: 'Rua A',
              contato_whatsapp: '+5511999999999',
              fuso_horario: 'America/Sao_Paulo',
              mensagem_confirmacao: 'Até breve',
              politica_atraso: 'Avise atrasos',
              tolerancia_atraso_min: 15,
            }),
            getProcedimentos: async () => [],
          },
        },
        {
          provide: CalendarioAgendamentoService,
          useValue: { baixarPublico: async () => {} },
        },
      ],
    });
  });
  it('query de sucesso adulterada não confirma pagamento pendente e mostra valores canônicos', async () => {
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).not.toContain('Agendamento confirmado!');
    expect(texto).toContain('Recebedor congelado');
    expect(texto).toContain('Total a autorizar');
    expect(retomar).toHaveBeenCalledWith({
      subdominio: 'salao-a',
      id: reserva.id,
      credencial: 'credencial-local',
    });
  });
  it('confirmação tardia orienta contato sem garantir o horário nem devolução automática', async () => {
    pagamento.set({
      ...pagamentoInicial,
      status: 'confirmada',
      situacao: 'confirmado_apos_expiracao',
    });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Seu horário não está garantido');
    expect(texto).toContain('Não há devolução automática');
    expect(texto).not.toContain('Agendamento confirmado!');
  });
  it('confirmação normal permite calendário', async () => {
    pagamento.set({ ...pagamentoInicial, status: 'confirmada' });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Agendamento confirmado!',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Adicionar ao calendário',
    );
  });
  it('escolher outro horário navega para o subdomínio atual', async () => {
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const link = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .find((elemento) =>
        (elemento.nativeElement.textContent as string).includes(
          'Escolher outro horário',
        ),
      );
    expect(link).toBeDefined();
    expect(link!.injector.get(RouterLink).urlTree?.toString()).toBe(
      '/s/salao-a',
    );
  });
});
