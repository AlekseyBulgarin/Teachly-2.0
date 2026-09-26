import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_PREFIX_PATTERN = /^tlk_[a-f0-9]{16}$/;

export function generateApiKey(): { prefix: string; secret: string; hash: string } {
  const prefix = `tlk_${randomBytes(8).toString('hex')}`;
  const secret = `${prefix}.${randomBytes(32).toString('base64url')}`;
  return { prefix, secret, hash: hashApiKey(secret) };
}

export function apiKeyPrefix(secret: string): string | null {
  const separator = secret.indexOf('.');
  if (separator < 0 || secret.indexOf('.', separator + 1) >= 0) return null;
  const prefix = secret.slice(0, separator);
  return KEY_PREFIX_PATTERN.test(prefix) && secret.length > separator + 1 ? prefix : null;
}

export function hashApiKey(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function apiKeyHashMatches(secret: string, storedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashApiKey(secret), 'hex'), Buffer.from(storedHash, 'hex'));
}
