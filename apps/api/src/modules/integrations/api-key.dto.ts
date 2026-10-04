import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { integrationScopes, type IntegrationScope } from './integrations.types';

const scopeValues = [...integrationScopes];

export class CreateApiKeyDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: scopeValues, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(scopeValues, { each: true })
  scopes!: IntegrationScope[];
}

export class ListApiKeysDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ApiKeyMetadataDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  keyPrefix!: string;

  @ApiProperty({ enum: scopeValues, isArray: true })
  scopes!: IntegrationScope[];

  @ApiProperty({ enum: ['active', 'revoked'] })
  status!: 'active' | 'revoked';

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  lastUsedAt!: Date | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  revokedAt!: Date | null;
}

export class ApiKeySecretResponseDto {
  @ApiProperty({ type: ApiKeyMetadataDto })
  key!: ApiKeyMetadataDto;

  @ApiProperty({ description: 'Raw API key secret. Returned only once.' })
  secret!: string;
}
