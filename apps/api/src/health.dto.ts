import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ enum: ['ok'] })
  database!: 'ok';
}

export class HealthUnavailableDto {
  @ApiProperty({ enum: ['degraded'] })
  status!: 'degraded';

  @ApiProperty({ enum: ['unavailable'] })
  database!: 'unavailable';
}
