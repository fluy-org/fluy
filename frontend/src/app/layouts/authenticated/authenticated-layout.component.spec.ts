import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { AuthenticatedLayoutComponent } from './authenticated-layout.component';

describe('AuthenticatedLayoutComponent', () => {
  it('encerra a sessao pelo menu autenticado', async () => {
    const logout = jasmine.createSpy('logout').and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { logout } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);

    await fixture.componentInstance.sair();

    expect(logout).toHaveBeenCalledOnceWith();
    expect(fixture.componentInstance.saindo()).toBeFalse();
  });
});
