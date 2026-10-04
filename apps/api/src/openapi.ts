import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Teachly API')
    .setDescription('Teacher-first learning vertical slice')
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: 'Authorization', in: 'header' }, 'workspace-api-key')
    .build();

  return SwaggerModule.createDocument(app, config);
}
