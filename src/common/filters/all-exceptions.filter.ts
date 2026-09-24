import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

const HTTP_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'TOO_MANY_REQUESTS',
};

function httpCodeFor(status: number): string {
  return HTTP_CODES[status] ?? 'INTERNAL_ERROR';
}

/**
 * Chuan hoa moi loi ve mot dang duy nhat de FE hien thong bao theo NFR-US.
 * { statusCode, code, message, details?, path, timestamp }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { code: 'INTERNAL_ERROR', message: 'Loi he thong' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        body = { code: httpCodeFor(status), message: res };
      } else {
        const obj = res as Record<string, unknown>;
        const raw = obj.message;
        body = {
          code: (obj.code as string) ?? httpCodeFor(status),
          message: Array.isArray(raw)
            ? (raw as string[]).join('; ')
            : ((raw as string) ?? exception.message),
          details: obj.details ?? (Array.isArray(raw) ? raw : undefined),
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(request.method + ' ' + request.url + ' -> ' + status + ' ' + body.code);
    }

    response.status(status).json({
      statusCode: status,
      code: body.code,
      message: body.message,
      details: body.details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
