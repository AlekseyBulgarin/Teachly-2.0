import { createHash, timingSafeEqual } from 'node:crypto';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function monitorRequestAuthorized(authorization: string | null, env: NodeJS.ProcessEnv = process.env): boolean {
  const expectedUser = env.TEACHLY_MONITOR_USER?.trim();
  const expectedPassword = env.TEACHLY_MONITOR_PASSWORD;
  if (!expectedUser || !expectedPassword || !authorization?.startsWith('Basic ')) return false;
  let supplied: string;
  try {
    supplied = Buffer.from(authorization.slice('Basic '.length), 'base64').toString('utf8');
  } catch {
    return false;
  }
  const separator = supplied.indexOf(':');
  if (separator < 0) return false;
  const user = supplied.slice(0, separator);
  const password = supplied.slice(separator + 1);
  return timingSafeEqual(digest(user), digest(expectedUser))
    && timingSafeEqual(digest(password), digest(expectedPassword));
}
