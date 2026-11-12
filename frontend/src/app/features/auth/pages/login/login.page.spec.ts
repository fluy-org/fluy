import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { ContaService } from '@app/features/auth/services/conta.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let montarLogin: jasmine.Spy;
  let desmontarLogin: jasmine.Spy;

  beforeEach(async () => {
    montarLogin = jasmine.createSpy('montarLogin').and.returnValue(true);
    desmontarLogin = jasmine.createSpy('desmontarLogin');

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(false),
            montarLogin,
            desmontarLogin,
          },
        },
        {
          provide: ContaService,
          useValue: {
            consultarAtual: jasmine
              .createSpy('consultarAtual')
              .and.resolveTo({ estado: 'ativo' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and mounts Clerk SignIn when unauthenticated', () => {
    expect(component).toBeTruthy();
    expect(montarLogin).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(desmontarLogin).toHaveBeenCalledTimes(1);
  });
});
