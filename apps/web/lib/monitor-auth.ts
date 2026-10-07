import { timingSafeEqual } from 'node:crypto';

const MAX_CREDENTIAL_BYTES = 1_024;

function constantTimeEqual(value: string, expected: string): boolean {
  const valueBytes = Buffer.from(value, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (valueBytes.length > MAX_CREDENTIAL_BYTES || expectedBytes.length > MAX_CREDENTIAL_BYTES) return false;
  const size = Math.max(valueBytes.length, expectedBytes.length, 1);
  const paddedValue = Buffer.alloc(size);
  const paddedExpected = Buffer.alloc(size);
  valueBytes.copy(paddedValue);
  expectedBytes.copy(paddedExpected);
  return timingSafeEqual(paddedValue, paddedExpected) && valueBytes.length === expectedBytes.length;
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
  return constantTimeEqual(user, expectedUser) && constantTimeEqual(password, expectedPassword);
}
