import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { TeachlyRequest } from './request-context';

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction): void {
  const requestId = request.header('x-request-id') ?? randomUUID();
  (request as TeachlyRequest).requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
