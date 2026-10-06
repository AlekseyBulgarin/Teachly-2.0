import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { TeachlyRequest } from './request-context';

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction): void {
  const suppliedRequestId = request.header('x-request-id')?.trim();
  const requestId = suppliedRequestId && suppliedRequestId.length <= 200
    ? suppliedRequestId
    : randomUUID();
  (request as TeachlyRequest).requestId = requestId;
  response.setHeader('x-request-id', requestId);
  if (request.path === '/v1' || request.path.startsWith('/v1/')) {
    response.setHeader('x-teachly-api-version', '1');
  }
  next();
}
