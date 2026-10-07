import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/public.decorator';
import { assertMetricsAuthorization } from './metrics-auth';
import { MonitoringOverviewDto } from './monitoring.dto';
import { MONITORING_RANGES, MonitoringQueryService, type MonitoringRange } from './monitoring-query.service';

@Controller('internal/monitoring')
@SkipThrottle()
@Public()
@ApiTags('operations')
@ApiBearerAuth('metrics-token')
@ApiUnauthorizedResponse({ description: 'The metrics bearer token is missing or invalid.' })
export class MonitoringController {
  constructor(private readonly monitoring: MonitoringQueryService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Read the bounded Teachly Monitor overview' })
  @ApiQuery({ name: 'range', required: false, enum: MONITORING_RANGES })
  @ApiOkResponse({ type: MonitoringOverviewDto })
  overview(@Headers('authorization') authorization: string | undefined, @Query('range') requestedRange?: string) {
    assertMetricsAuthorization(authorization);
    const range = requestedRange ?? '1h';
    if (!MONITORING_RANGES.includes(range as MonitoringRange)) throw new BadRequestException('Unsupported monitoring range');
    return this.monitoring.overview(range as MonitoringRange);
  }
}
