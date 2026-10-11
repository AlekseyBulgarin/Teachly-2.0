import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthenticationAdapter } from './auth.port';
import type { ExternalPrincipal } from './auth.types';

export type NeonTokenVerifier = {
  verify(token: string): Promise<JWTPayload>;
};

@Injectable()
export class NeonJwtVerifier implements NeonTokenVerifier {
  private cachedBaseUrl?: URL;
  private cachedJwks?: ReturnType<typeof createRemoteJWKSet>;

  private configuration(): { baseUrl: URL; jwks: ReturnType<typeof createRemoteJWKSet> } {
    const configured = process.env.NEON_AUTH_BASE_URL?.trim();
    if (!configured) throw new Error('NEON_AUTH_BASE_URL is required for Neon authentication');
    const baseUrl = new URL(configured.endsWith('/') ? configured : `${configured}/`);
    if (!this.cachedBaseUrl || this.cachedBaseUrl.toString() !== baseUrl.toString() || !this.cachedJwks) {
      this.cachedBaseUrl = baseUrl;
      this.cachedJwks = createRemoteJWKSet(new URL('.well-known/jwks.json', baseUrl));
    }
    return { baseUrl, jwks: this.cachedJwks };
  }

  async verify(token: string): Promise<JWTPayload> {
    const { baseUrl, jwks } = this.configuration();
    const issuer = baseUrl.toString().replace(/\/$/, '');
    const audience = baseUrl.origin;
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['EdDSA'],
      issuer,
      audience,
    });
    return payload;
  }
}

@Injectable()
export class NeonAuthenticationAdapter implements AuthenticationAdapter {
  constructor(private readonly verifier: NeonJwtVerifier) {}

  async resolve(request: { headers: Record<string, unknown> }): Promise<ExternalPrincipal | null> {
    const authorization = request.headers.authorization;
    const value = Array.isArray(authorization) ? authorization[0] : authorization;
    if (typeof value !== 'string' || !value.startsWith('Bearer ')) return null;
    const token = value.slice('Bearer '.length).trim();
    if (!token || token.startsWith('tlk_')) return null;
    try {
      const payload = await this.verifier.verify(token);
      if (!payload.sub) throw new UnauthorizedException('Authentication token has no subject');
      return { provider: 'neon', subject: payload.sub };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
