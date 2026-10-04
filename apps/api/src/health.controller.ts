import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from './common/public.decorator';
import { DatabaseService } from './infrastructure/database/database';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get()
  async health() {
    try {
      await this.database.ping();
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', database: 'unavailable' });
    }
  }
}
