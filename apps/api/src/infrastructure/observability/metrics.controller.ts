import { Controller, Get, Headers, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Public } from '../../common/public.decorator';
import { MetricsService } from './metrics.service';

function tokenDigest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Controller('metrics')
@SkipThrottle()
@Public()
@ApiTags('operations')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiBearerAuth('metrics-token')
  @ApiOkResponse({
    description: 'Prometheus text exposition for the API process.',
    content: { 'text/plain': { schema: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'The metrics bearer token is missing or invalid.' })
  async read(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) response: Response): Promise<string> {
    this.assertAuthorized(authorization);
    response.setHeader('Content-Type', this.metrics.contentType);
    response.setHeader('Cache-Control', 'no-store');
    return this.metrics.exposition();
  }

  private assertAuthorized(authorization: string | undefined): void {
    const expected = process.env.METRICS_TOKEN;
    if (!expected && process.env.NODE_ENV !== 'production') return;
    const supplied = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : '';
    if (!expected || !supplied || !timingSafeEqual(tokenDigest(expected), tokenDigest(supplied))) {
      throw new UnauthorizedException('Invalid metrics token');
    }
  }
}
