import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { ExternalUserView } from './external-users.types';

export class UpsertExternalUserDto {
  @ApiProperty({ minLength: 1, maxLength: 255, example: 'learner-42' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  externalUserId!: string;
}

export class ListExternalUsersDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class ExternalUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ format: 'uuid' })
  integrationId!: string;

  @ApiProperty()
  externalUserId!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static from(externalUser: ExternalUserView): ExternalUserResponseDto {
    return {
      id: externalUser.id,
      organizationId: externalUser.organizationId,
      workspaceId: externalUser.workspaceId,
      integrationId: externalUser.integrationId,
      externalUserId: externalUser.externalUserId,
      status: externalUser.status,
      createdAt: externalUser.createdAt,
      updatedAt: externalUser.updatedAt,
    };
  }
}
