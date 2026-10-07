import { Controller, Get, Headers, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/public.decorator';
import { assertMetricsAuthorization } from './metrics-auth';
import { MetricsService } from './metrics.service';
import { DatabaseService } from '../database/database';

@Controller('metrics')
@SkipThrottle()
@Public()
@ApiTags('operations')
export class MetricsController {
  constructor(private readonly metrics: MetricsService, private readonly database: DatabaseService) {}

  @Get()
  @ApiBearerAuth('metrics-token')
  @ApiOkResponse({
    description: 'Prometheus text exposition for the API process.',
    content: { 'text/plain': { schema: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'The metrics bearer token is missing or invalid.' })
  async read(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) response: Response): Promise<string> {
    assertMetricsAuthorization(authorization);
    try {
      await this.database.ping();
      this.metrics.setDatabaseAvailable(true);
    } catch {
      this.metrics.setDatabaseAvailable(false);
    }
    response.setHeader('Content-Type', this.metrics.contentType);
    response.setHeader('Cache-Control', 'no-store');
    return this.metrics.exposition();
  }

}
