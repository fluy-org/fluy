import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ZodValidationException } from 'nestjs-zod';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  messages: string[];
  codigo?: string;
  sugestoes?: string[];
  requestId?: string;
}

const DEFAULT_ERROR_NAME = 'Internal Server Error';
const DEFAULT_MESSAGE = 'Internal Server Error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, messages, codigo, sugestoes } =
      this.buildErrorPayload(exception);

    this.logger.error(
      {
        err: exception,
        statusCode,
        method: request.method,
        url: request.url,
      },
      messages.join('; '),
    );

    const body: ErrorResponseBody = {
      statusCode,
      error,
      messages,
    };
    if (codigo) body.codigo = codigo;
    if (sugestoes) body.sugestoes = sugestoes;
    const requestId = this.extractRequestId(request);
    if (requestId) {
      body.requestId = requestId;
    }

    response.status(statusCode).json(body);
  }

  private extractRequestId(request: Request): string | undefined {
    const id = (request as unknown as { id?: unknown }).id;
    if (typeof id === 'string' && id.length > 0) return id;
    if (typeof id === 'number') return String(id);
    return undefined;
  }

  private buildErrorPayload(exception: unknown): {
    statusCode: number;
    error: string;
    messages: string[];
    codigo?: string;
    sugestoes?: string[];
  } {
    if (exception instanceof ZodValidationException) {
      return this.buildZodPayload(exception);
    }

    if (exception instanceof HttpException) {
      return this.buildHttpPayload(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: DEFAULT_ERROR_NAME,
      messages: [DEFAULT_MESSAGE],
    };
  }

  private buildZodPayload(exception: ZodValidationException): {
    statusCode: number;
    error: string;
    messages: string[];
  } {
    const zodError = exception.getZodError() as
      | { issues?: Array<{ path: Array<string | number>; message: string }> }
      | undefined;

    const issues = zodError?.issues ?? [];
    const messages =
      issues.length > 0
        ? issues.map((issue) => {
            const path = issue.path.join('.');
            return path ? `${path}: ${issue.message}` : issue.message;
          })
        : ['Validation failed'];

    return {
      statusCode: exception.getStatus(),
      error: 'Bad Request',
      messages,
    };
  }

  private buildHttpPayload(exception: HttpException): {
    statusCode: number;
    error: string;
    messages: string[];
    codigo?: string;
    sugestoes?: string[];
  } {
    const statusCode = exception.getStatus();
    const responseData = exception.getResponse();

    let messages: string[] = [exception.message];
    let error = this.errorNameFromStatus(statusCode);

    if (typeof responseData === 'string') {
      messages = [responseData];
    } else if (typeof responseData === 'object' && responseData !== null) {
      const data = responseData as {
        message?: unknown;
        error?: unknown;
        codigo?: unknown;
        sugestoes?: unknown;
      };

      if (Array.isArray(data.message)) {
        messages = data.message.map((m) => String(m));
      } else if (typeof data.message === 'string') {
        messages = [data.message];
      }

      if (typeof data.error === 'string') {
        error = data.error;
      }

      return {
        statusCode,
        error,
        messages,
        codigo: typeof data.codigo === 'string' ? data.codigo : undefined,
        sugestoes: Array.isArray(data.sugestoes)
          ? data.sugestoes.filter(
              (sugestao): sugestao is string => typeof sugestao === 'string',
            )
          : undefined,
      };
    }

    return { statusCode, error, messages };
  }

  private errorNameFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
    };
    return map[status] ?? (status >= 500 ? DEFAULT_ERROR_NAME : 'Error');
  }
}
