import { ApiProperty } from '@nestjs/swagger';
import { integrationScopes, type IntegrationScope } from './integrations.types';

export class IntegrationContextDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ enum: ['active', 'disabled'] }) status!: string;
  @ApiProperty({ enum: integrationScopes, isArray: true }) scopes!: IntegrationScope[];
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}
