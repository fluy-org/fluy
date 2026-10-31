import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { ConvitePage } from './convite.page';

describe('ConvitePage', () => {
  let fixture: ComponentFixture<ConvitePage>;
  let queryParamMap: ParamMap;
  let authService: {
    isAuthenticated: WritableSignal<boolean>;
    prepararCadastroPorConvite: jasmine.Spy;
    concluirCadastroPorConvite: jasmine.Spy;
  };

  beforeEach(async () => {
    queryParamMap = convertToParamMap({ __clerk_ticket: 'ticket-valido' });
    authService = {
      isAuthenticated: signal(false),
      prepararCadastroPorConvite: jasmine
        .createSpy('prepararCadastroPorConvite')
        .and.resolveTo({ email: 'ana@example.com' }),
      concluirCadastroPorConvite: jasmine
        .createSpy('concluirCadastroPorConvite')
        .and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [ConvitePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap(): ParamMap {
                return queryParamMap;
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('valida o ticket antes de exibir o formulario preso ao e-mail convidado', async () => {
    fixture = TestBed.createComponent(ConvitePage);
    let captchaExistiaDuranteValidacao = false;
    authService.prepararCadastroPorConvite.and.callFake(async () => {
      captchaExistiaDuranteValidacao = Boolean(
        fixture.nativeElement.querySelector('#clerk-captcha'),
      );
      return { email: 'ana@example.com' };
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(captchaExistiaDuranteValidacao).toBeTrue();
    expect(authService.prepararCadastroPorConvite).toHaveBeenCalledOnceWith(
      'ticket-valido',
    );
    expect(fixture.componentInstance.emailConvite()).toBe('ana@example.com');
    expect(fixture.componentInstance.estado()).toBe('cadastro');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Continue with Google',
    );
  });

  it('nao abre cadastro quando nao existe ticket', async () => {
    queryParamMap = convertToParamMap({});
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.prepararCadastroPorConvite).not.toHaveBeenCalled();
    expect(fixture.componentInstance.estado()).toBe('sem_convite');
  });

  it('informa e valida o tamanho minimo da senha antes do cadastro', async () => {
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const ajudaSenha = fixture.nativeElement.querySelector('.ajuda-senha');

    expect(ajudaSenha?.textContent).toContain(
      'A senha precisa ter pelo menos 8 caracteres.',
    );

    const senha = fixture.componentInstance.formulario.controls.senha;
    senha.setValue('1234567');
    expect(senha.invalid).toBeTrue();
    senha.setValue('12345678');
    expect(senha.valid).toBeTrue();
  });

  it('nao abre cadastro quando o Clerk rejeita um convite expirado', async () => {
    authService.prepararCadastroPorConvite.and.rejectWith({
      errors: [{ code: 'ticket_expired_code' }],
    });
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.estado()).toBe('expirado');
  });

  it('bloqueia o convite enquanto existe uma sessao ativa', async () => {
    authService.isAuthenticated.set(true);
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.prepararCadastroPorConvite).not.toHaveBeenCalled();
    expect(fixture.componentInstance.estado()).toBe('sessao_ativa');
  });

  it('envia apenas nome, sobrenome e senha e preserva o onboarding', async () => {
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.formulario.setValue({
      nome: ' Ana ',
      sobrenome: ' Silva ',
      senha: 'senha-segura-123',
    });

    await fixture.componentInstance.concluirCadastro();

    expect(authService.concluirCadastroPorConvite).toHaveBeenCalledOnceWith({
      nome: ' Ana ',
      sobrenome: ' Silva ',
      senha: 'senha-segura-123',
    });
    expect(navegar).toHaveBeenCalledOnceWith(['/concluir-cadastro'], {
      replaceUrl: true,
    });
  });

  it('exibe erro de senha sem abandonar o convite', async () => {
    authService.concluirCadastroPorConvite.and.rejectWith({
      errors: [{ code: 'form_password_pwned' }],
    });
    fixture = TestBed.createComponent(ConvitePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.formulario.setValue({
      nome: 'Ana',
      sobrenome: 'Silva',
      senha: 'senha-vazada-1234',
    });

    await fixture.componentInstance.concluirCadastro();

    expect(fixture.componentInstance.estado()).toBe('cadastro');
    expect(fixture.componentInstance.erroCadastro()).toContain('vazamentos');
  });
});
