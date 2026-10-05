import { Logger } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { TeachlyRequest } from '../../common/request-context';
import { MetricsService } from './metrics.service';

const logger = new Logger('HttpRequest');

function routeTemplate(request: Request): string {
  const route = request.route as { path?: unknown } | undefined;
  if (typeof route?.path !== 'string') return 'unmatched';
  return `${request.baseUrl ?? ''}${route.path}` || '/';
}

export function createHttpObservabilityMiddleware(metrics: MetricsService): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    const method = request.method.toUpperCase();
    const startedAt = process.hrtime.bigint();
    const stopInFlight = metrics.startRequest(method);
    let completed = false;

    const complete = (): void => {
      if (completed) return;
      completed = true;
      stopInFlight();
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
      const route = routeTemplate(request);
      metrics.observeRequest({ method, route, statusCode: String(response.statusCode) }, durationSeconds);
      logger.log({
        event: 'http_request_completed',
        method,
        route,
        statusCode: response.statusCode,
        durationMs: Math.round(durationSeconds * 1000 * 100) / 100,
        requestId: (request as TeachlyRequest).requestId,
      });
    };

    response.once('finish', complete);
    response.once('close', complete);
    next();
  };
}
