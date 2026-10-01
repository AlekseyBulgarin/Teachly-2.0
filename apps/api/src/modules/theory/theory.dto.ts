import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTheoryMaterialDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(240) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) category?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() topicId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() skillId?: string;
  @ApiPropertyOptional({ type: [String], format: 'uuid' }) @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID('4', { each: true }) taskIds?: string[];
  @ApiProperty({ type: Object }) @IsObject() content!: Record<string, unknown>;
}

export class UpdateTheoryDraftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(240) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) category?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() topicId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() skillId?: string;
  @ApiPropertyOptional({ type: [String], format: 'uuid' }) @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID('4', { each: true }) taskIds?: string[];
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() content?: Record<string, unknown>;
}

export class TheoryListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() topicId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() skillId?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class TheoryMaterialResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() category!: string | null;
  @ApiProperty({ enum: ['draft', 'published'] }) status!: string;
  @ApiProperty({ type: Object }) curriculum!: Record<string, string | null>;
  @ApiProperty({ type: [String] }) taskIds!: string[];
  @ApiProperty({ type: Object }) version!: Record<string, unknown>;
}

