import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiError } from '@app/core/errors/api-error';
import { ContaService } from '@app/features/auth/services/conta.service';

export const comSalaoGuard: CanActivateFn = async () => {
  const contaService = inject(ContaService);
  const router = inject(Router);

  try {
    const conta = await contaService.consultarAtual();

    if (conta.estado === 'sem-salao') {
      return router.createUrlTree(['/onboarding']);
    }

    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return router.createUrlTree(['/concluir-cadastro']);
    }

    return router.createUrlTree(['/login']);
  }
};
