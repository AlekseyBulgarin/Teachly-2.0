import { ApiProperty } from '@nestjs/swagger';

export class MonitoringPointDto {
  @ApiProperty({ example: 1791396000 }) timestamp!: number;
  @ApiProperty({ example: 0.42 }) value!: number;
}

export class MonitoringSeriesDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) labels!: Record<string, string>;
  @ApiProperty({ type: [MonitoringPointDto] }) points!: MonitoringPointDto[];
}

export class MonitoringPanelDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: ['stat', 'timeseries'] }) kind!: 'stat' | 'timeseries';
  @ApiProperty({ enum: ['requests_per_second', 'ratio', 'seconds', 'count', 'bytes', 'tokens_per_second', 'micros_per_second'] }) unit!: string;
  @ApiProperty({ enum: ['ok', 'empty', 'error', 'not_configured'] }) status!: 'ok' | 'empty' | 'error' | 'not_configured';
  @ApiProperty({ enum: ['healthy', 'warning', 'critical', 'unknown'] }) alert!: 'healthy' | 'warning' | 'critical' | 'unknown';
  @ApiProperty({ required: false, nullable: true }) message!: string | null;
  @ApiProperty({ type: [MonitoringSeriesDto] }) series!: MonitoringSeriesDto[];
}

export class MonitoringOverviewDto {
  @ApiProperty({ enum: ['prometheus', 'not_configured'] }) source!: 'prometheus' | 'not_configured';
  @ApiProperty({ enum: ['15m', '1h', '6h', '24h', '7d'] }) range!: string;
  @ApiProperty() generatedAt!: string;
  @ApiProperty() stale!: boolean;
  @ApiProperty({ type: [MonitoringPanelDto] }) panels!: MonitoringPanelDto[];
}
