import { NestApplication, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { requiredEnvironment } from './common/config';
import { configureHttpApp } from './common/configure-http-app';
import { createOpenApiDocument } from './openapi';

async function bootstrap(): Promise<void> {
  requiredEnvironment();
  const app = await NestFactory.create<NestApplication>(AppModule);
  configureHttpApp(app);
  SwaggerModule.setup('docs', app, createOpenApiDocument(app));
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
