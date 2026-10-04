import { NestApplication, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { requiredEnvironment } from './common/config';
import { configureHttpApp } from './common/configure-http-app';

async function bootstrap(): Promise<void> {
  requiredEnvironment();
  const app = await NestFactory.create<NestApplication>(AppModule);
  configureHttpApp(app);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Teachly API')
    .setDescription('Teacher-first learning vertical slice')
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: 'Authorization', in: 'header' }, 'workspace-api-key')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
