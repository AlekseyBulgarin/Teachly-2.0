import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { requiredEnvironment } from './common/config';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { requestIdMiddleware } from './common/request-id.middleware';

async function bootstrap(): Promise<void> {
  requiredEnvironment();
  const app = await NestFactory.create(AppModule);
  app.use(requestIdMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Teachly API')
    .setDescription('Teacher-first learning vertical slice')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
