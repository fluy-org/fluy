import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../errors/api-error';

const MENSAGEM_ERRO_PADRAO =
  'Não foi possível concluir a solicitação. Tente novamente.';

function extrairMensagemErro(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const { messages } = body as { messages?: unknown };

  if (!Array.isArray(messages)) {
    return null;
  }

  return (
    messages.find(
      (mensagem): mensagem is string =>
        typeof mensagem === 'string' && mensagem.trim().length > 0,
    ) ?? null
  );
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      return throwError(
        () =>
          new ApiError(
            extrairMensagemErro(error.error) ?? MENSAGEM_ERRO_PADRAO,
            error.status,
            error.error,
          ),
      );
    }),
  );
