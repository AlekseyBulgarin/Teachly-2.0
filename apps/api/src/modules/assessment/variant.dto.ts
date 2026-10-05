import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class VariantItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(200) externalTaskId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() taskVersionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) section?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class CreateVariantDraftDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() taskSourceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) externalVariantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) idempotencyKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(240) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() rawPayload?: Record<string, unknown>;
  @ApiPropertyOptional({ type: [VariantItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantItemDto) items?: VariantItemDto[];
}

export class UpdateVariantDraftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(240) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @ApiPropertyOptional({ type: [VariantItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantItemDto) items?: VariantItemDto[];
}

export class VariantListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ type: Number, default: 50, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class VariantItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ minimum: 0 }) position!: number;
  @ApiProperty({ format: 'uuid', nullable: true }) taskVersionId!: string | null;
  @ApiProperty({ nullable: true }) externalTaskId!: string | null;
  @ApiProperty({ default: true }) required!: boolean;
  @ApiProperty({ enum: ['resolved', 'unresolved'], description: 'Resolved only once a published task version is linked.' }) resolutionStatus!: string;
  @ApiProperty({ nullable: true }) section!: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata!: Record<string, unknown>;
}

export class VariantVersionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) variantId!: string;
  @ApiProperty({ example: 2 }) version!: number;
  @ApiProperty({ enum: ['draft', 'published', 'archived'] }) status!: string;
  @ApiProperty({ nullable: true }) title!: string | null;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata!: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true, description: 'Origin of the version (source, snapshot, edit history).' }) provenance!: Record<string, unknown>;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: [VariantItemResponseDto] }) items!: VariantItemResponseDto[];
}

export class CreatedVariantVersionResponseDto extends VariantVersionResponseDto {
  @ApiProperty({ description: 'True when the same idempotencyKey was replayed instead of creating again.' })
  idempotentReplay!: boolean;
}
