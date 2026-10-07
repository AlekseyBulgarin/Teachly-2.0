import { UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

function tokenDigest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function assertMetricsAuthorization(authorization: string | undefined): void {
  const expected = process.env.METRICS_TOKEN;
  if (!expected && process.env.NODE_ENV !== 'production') return;
  const supplied = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : '';
  if (!expected || !supplied || !timingSafeEqual(tokenDigest(expected), tokenDigest(supplied))) {
    throw new UnauthorizedException('Invalid metrics token');
  }
}
