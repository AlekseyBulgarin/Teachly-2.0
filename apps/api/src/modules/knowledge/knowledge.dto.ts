import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class KnowledgeStatusQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class KnowledgeStatusResponseDto {
  @ApiProperty({ format: 'uuid' }) sourceId!: string;

  @ApiProperty({ example: 'Textbook corpus' }) sourceName!: string;

  @ApiProperty({ example: 'uploaded' }) sourceType!: string;

  @ApiProperty({ enum: ['active', 'disabled'] }) sourceStatus!: string;

  @ApiProperty({ enum: ['unknown', 'allowed', 'restricted'] }) sourceLicenseStatus!: string;

  @ApiProperty({ format: 'uuid' }) documentId!: string;

  @ApiProperty({ example: 'Algebra handbook' }) documentTitle!: string;

  @ApiProperty({ enum: ['active', 'disabled'] }) documentStatus!: string;

  @ApiProperty({ format: 'uuid' }) versionId!: string;

  @ApiProperty({ example: 4 }) version!: number;

  @ApiProperty({ enum: ['draft', 'approved', 'rejected', 'disabled', 'superseded'] }) versionStatus!: string;

  @ApiProperty({ enum: ['unknown', 'allowed', 'restricted'] }) licenseStatus!: string;

  @ApiProperty({ enum: ['not_reviewed', 'allowed', 'prohibited'], description: 'Whether this version may be sent to external AI providers.' })
  externalAiPermission!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true }) approvedAt!: Date | null;
}
