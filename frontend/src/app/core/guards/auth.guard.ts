import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Lê o valor do signal de autenticação.
  // O APP_INITIALIZER garante que este valor já foi verificado
  // antes da primeira navegação.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Se não estiver autenticado, cria uma UrlTree para redirecionar para a página de login.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
