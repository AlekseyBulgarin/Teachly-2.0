import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Teachly API')
    .setDescription('Versioned integration API for the Teachly learning platform')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Teachly workspace API key',
      description: 'Workspace-scoped API key. Never expose it in browser code.',
    }, 'workspace-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  addV1ProtocolContract(document);
  return document;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

function addV1ProtocolContract(document: OpenAPIObject): void {
  const components = document.components ??= {};
  components.parameters ??= {};
  components.responses ??= {};
  components.parameters.TeachlyRequestId = {
    name: 'x-request-id',
    in: 'header',
    required: false,
    description: 'Optional caller correlation id. Echoed in the response; generated when omitted.',
    schema: { type: 'string', maxLength: 200 },
  };
  const errorResponse = (description: string) => ({
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorDto' } } },
  });
  components.responses.TeachlyTooManyRequests = errorResponse(
    'Quota exceeded. Retry after the current rate-limit window.',
  );
  components.responses.TeachlyInternalError = errorResponse(
    'Unexpected server error. Report the x-request-id to Teachly support.',
  );

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!path.startsWith('/v1/')) continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];
      if (!operation) continue;
      operation.parameters = [
        ...(operation.parameters ?? []).filter((parameter) => '$ref' in parameter
          || !(parameter.in === 'header' && parameter.name.toLowerCase() === 'x-request-id')),
        { $ref: '#/components/parameters/TeachlyRequestId' },
      ];
      operation.responses['429'] ??= { $ref: '#/components/responses/TeachlyTooManyRequests' };
      operation.responses['500'] ??= { $ref: '#/components/responses/TeachlyInternalError' };
    }
  }
}
