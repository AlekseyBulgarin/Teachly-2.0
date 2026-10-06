import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated';

type ClientContract<T> = T extends readonly (infer Item)[]
  ? ClientContract<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: ClientContract<T[Key]> }
    : T;

export type TeachlyClientOptions = {
  baseUrl: string;
  apiKey?: string;
  getApiKey?: () => string | undefined | Promise<string | undefined>;
  fetch?: typeof globalThis.fetch;
  requestId?: () => string;
};

function removeTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1;
  return value.slice(0, end);
}

export function createTeachlyClient(options: TeachlyClientOptions) {
  if (options.apiKey && options.getApiKey) {
    throw new Error('Provide either apiKey or getApiKey, not both');
  }

  // Generated contracts are immutable for application code. openapi-fetch maps
  // response containers, so the client receives an equivalent mutable view to
  // preserve native Array methods in inferred response types.
  const client = createClient<ClientContract<paths>>({
    baseUrl: removeTrailingSlashes(options.baseUrl),
    fetch: options.fetch,
  });
  const authentication: Middleware = {
    async onRequest({ request, schemaPath }) {
      if (schemaPath.startsWith('/v1/')) {
        const apiKey = options.apiKey ?? await options.getApiKey?.();
        if (apiKey) request.headers.set('authorization', `Bearer ${apiKey}`);
      }
      request.headers.set('accept', 'application/json');
      request.headers.set(
        'x-request-id',
        options.requestId?.() ?? globalThis.crypto.randomUUID(),
      );
      return request;
    },
  };
  client.use(authentication);
  return client;
}

export type TeachlyClient = ReturnType<typeof createTeachlyClient>;
