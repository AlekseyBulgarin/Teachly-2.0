import { UnauthorizedException } from '@nestjs/common';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { NeonAuthenticationAdapter, NeonJwtVerifier, type NeonTokenVerifier } from './neon-auth.adapter';

describe('NeonAuthenticationAdapter', () => {
  const verifier = { verify: jest.fn<Promise<JWTPayload>, [string]>() };
  const adapter = new NeonAuthenticationAdapter(verifier as NeonTokenVerifier as never);

  beforeEach(() => verifier.verify.mockReset());

  it('maps a verified Neon subject without trusting client claims for roles', async () => {
    verifier.verify.mockResolvedValue({ sub: 'auth-user-123' });
    await expect(adapter.resolve({ headers: { authorization: 'Bearer signed.jwt.value' } }))
      .resolves.toEqual({ provider: 'neon', subject: 'auth-user-123' });
    expect(verifier.verify).toHaveBeenCalledWith('signed.jwt.value');
  });

  it('ignores absent and machine credentials', async () => {
    await expect(adapter.resolve({ headers: {} })).resolves.toBeNull();
    await expect(adapter.resolve({ headers: { authorization: 'Bearer tlk_machine.secret' } })).resolves.toBeNull();
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('fails closed for invalid tokens and missing subjects', async () => {
    verifier.verify.mockRejectedValueOnce(new Error('signature failed'));
    await expect(adapter.resolve({ headers: { authorization: 'Bearer invalid.jwt' } }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    verifier.verify.mockResolvedValueOnce({});
    await expect(adapter.resolve({ headers: { authorization: 'Bearer subjectless.jwt' } }))
      .rejects.toThrow('no subject');
  });

  it('verifies an EdDSA token against the configured JWKS, issuer and audience', async () => {
    const { publicKey, privateKey } = await generateKeyPair('EdDSA');
    const jwk = await exportJWK(publicKey);
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ keys: [{ ...jwk, kid: 'test-key', alg: 'EdDSA', use: 'sig' }] }));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test JWKS server did not bind');
    const previous = process.env.NEON_AUTH_BASE_URL;
    const baseUrl = `http://127.0.0.1:${address.port}/teachly/auth`;
    process.env.NEON_AUTH_BASE_URL = baseUrl;
    try {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
        .setSubject('auth-user-verified')
        .setIssuer(baseUrl)
        .setAudience(new URL(baseUrl).origin)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
      await expect(new NeonJwtVerifier().verify(token)).resolves.toMatchObject({ sub: 'auth-user-verified' });
    } finally {
      if (previous === undefined) delete process.env.NEON_AUTH_BASE_URL;
      else process.env.NEON_AUTH_BASE_URL = previous;
      server.close();
      await once(server, 'close');
    }
  });
});
