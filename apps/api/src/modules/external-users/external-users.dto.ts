import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { ExternalUserView } from './external-users.types';

export class UpsertExternalUserDto {
  @ApiProperty({ minLength: 1, maxLength: 255, example: 'learner-42' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  externalUserId!: string;
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
    return { ...externalUser };
  }
}
