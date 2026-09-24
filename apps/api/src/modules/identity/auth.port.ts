import type { ExternalPrincipal } from './auth.types';

export const AUTHENTICATION_ADAPTER = Symbol('AUTHENTICATION_ADAPTER');

export interface AuthenticationAdapter {
  resolve(request: { headers: Record<string, unknown> }): Promise<ExternalPrincipal | null>;
}
