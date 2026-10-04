import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/public.decorator';
import { DatabaseService } from './infrastructure/database/database';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthStatusDto, HealthUnavailableDto } from './health.dto';

@Controller('health')
@SkipThrottle()
@ApiTags('operations')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'API process and database are available.', type: HealthStatusDto })
  @ApiServiceUnavailableResponse({ description: 'The database availability check failed.', type: HealthUnavailableDto })
  async health(): Promise<HealthStatusDto> {
    try {
      await this.database.ping();
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', database: 'unavailable' });
    }
  }
}
