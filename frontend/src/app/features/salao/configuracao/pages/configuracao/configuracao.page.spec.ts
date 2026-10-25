import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  ConfiguracaoSalaoResponseDto,
  SalaoResponseDto,
} from '@fluy/schema';
import { ConfiguracaoService } from '@app/features/salao/configuracao/services/configuracao.service';
import { ConfiguracaoPage } from './configuracao.page';

describe('ConfiguracaoPage', () => {
  let component: ConfiguracaoPage;
  let fixture: ComponentFixture<ConfiguracaoPage>;
  let descritorClipboardOriginal: PropertyDescriptor | undefined;

  const configuracao: ConfiguracaoSalaoResponseDto = {
    granularidade_min: 30,
    prazo_reserva_min: 15,
    tolerancia_atraso_min: 15,
    antecedencia_min_horas: 2,
    antecedencia_max_dias: 60,
    mensagem_confirmacao: null,
    politica_atraso: null,
  };
  const salao: SalaoResponseDto = {
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'Salão da Ana',
    subdominio: 'salao-da-ana',
    contato_whatsapp: '5511999999999',
    endereco: 'Rua das Flores, 1',
    fuso_horario: 'America/Sao_Paulo',
    criado_em: '2026-10-22T12:30:00.000Z',
  };
  const configuracaoService = {
    getEntidade: jasmine.createSpy('getEntidade'),
    getSalaoAtual: jasmine.createSpy('getSalaoAtual'),
    updateEntidade: jasmine.createSpy('updateEntidade'),
  };

  beforeEach(async () => {
    descritorClipboardOriginal = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    );
    configuracaoService.getEntidade.and.resolveTo(configuracao);
    configuracaoService.getSalaoAtual.and.resolveTo(salao);
    configuracaoService.updateEntidade.and.resolveTo(configuracao);

    await TestBed.configureTestingModule({
      imports: [ConfiguracaoPage],
      providers: [
        { provide: ConfiguracaoService, useValue: configuracaoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    if (descritorClipboardOriginal) {
      Object.defineProperty(
        navigator,
        'clipboard',
        descritorClipboardOriginal,
      );
    } else {
      delete (navigator as unknown as { clipboard?: Clipboard }).clipboard;
    }
  });

  it('exibe o link publico com a origem atual e o subdominio do salao', () => {
    expect(component.linkPublico()).toBe(
      `${window.location.origin}/s/salao-da-ana`,
    );
    expect(fixture.nativeElement.textContent).toContain(
      component.linkPublico(),
    );
  });

  it('copia o link publico completo e confirma a acao', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    definirClipboard(writeText);

    await component.copiarLinkPublico();

    expect(writeText).toHaveBeenCalledOnceWith(component.linkPublico());
    expect(component.mensagemLinkPublico()).toContain('Link copiado');
    expect(component.erroLinkPublico()).toBeNull();
  });

  it('orienta a copia manual quando o navegador recusa o clipboard', async () => {
    const writeText = jasmine
      .createSpy('writeText')
      .and.rejectWith(new Error('Clipboard bloqueado.'));
    definirClipboard(writeText);

    await component.copiarLinkPublico();

    expect(component.erroLinkPublico()).toContain('copie manualmente');
    expect(component.mensagemLinkPublico()).toBeNull();
  });

  function definirClipboard(writeText: jasmine.Spy): void {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  }
});
