import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from './errors';
import type { TeachlyRequest } from './request-context';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<TeachlyRequest & Request>();
    const response = context.getResponse<Response>();
    const requestId = request.requestId;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof DomainError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') message = payload;
      else if (typeof payload === 'object' && payload !== null) {
        const body = payload as { message?: string | string[]; error?: string };
        code = body.error?.toUpperCase().replaceAll(' ', '_') ?? code;
        message = Array.isArray(body.message) ? 'Validation failed' : body.message ?? message;
        details = Array.isArray(body.message) ? body.message : undefined;
      }
    } else {
      console.error(exception);
    }

    response.status(status).json({ statusCode: status, code, message, details, requestId });
  }
}
