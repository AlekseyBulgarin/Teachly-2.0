import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringQueryService } from './monitoring-query.service';

@Module({
  controllers: [MetricsController, MonitoringController],
  providers: [MetricsService, MonitoringQueryService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
