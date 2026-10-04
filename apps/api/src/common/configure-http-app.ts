import { ValidationPipe } from '@nestjs/common';
import type { NestApplication } from '@nestjs/core';
import helmet from 'helmet';
import { HttpExceptionFilter } from './http-exception.filter';
import { requestIdMiddleware } from './request-id.middleware';

export function configureHttpApp(app: NestApplication): void {
  // Railway and local reverse proxies terminate TLS one hop in front of the API.
  // Trust exactly that hop so IP-based controls use the originating address.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));
  app.useBodyParser('json', { limit: '2mb' });
  app.use(requestIdMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
}
