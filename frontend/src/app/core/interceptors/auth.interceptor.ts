import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getToken()).pipe(
    switchMap((token) => next(token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req,
    )),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.handleUnauthorized();
      }

      return throwError(() => error);
    }),
  );
};
