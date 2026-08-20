import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/') || request.url.startsWith('//')) {
    return next(request);
  }

  return next(
    request.clone({
      url: `${environment.apiUrl}${request.url}`,
    }),
  );
};
