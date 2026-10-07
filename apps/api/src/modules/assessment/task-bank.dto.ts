import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, MinLength, Min } from 'class-validator';
import type { CurriculumMappingType } from './task-bank.types';

export class CreateTaskSourceDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) sourceType!: string;
  @ApiProperty({ enum: ['imported_snapshot', 'external_reference'] }) @IsIn(['imported_snapshot', 'external_reference']) mode!: 'imported_snapshot' | 'external_reference';
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() integrationId?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class ImportTaskDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) externalTaskId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) idempotencyKey!: string;
  @ApiProperty({ type: Object }) @IsObject() rawPayload!: Record<string, unknown>;
}

export class CreateDraftDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() workspaceId!: string;
  @ApiProperty() @IsString() @MinLength(1) taskType!: string;
  @ApiProperty({ type: Object }) @IsObject() content!: Record<string, unknown>;
  @ApiProperty({ type: Object }) @IsObject() answerSchema!: Record<string, unknown>;
}

export class UpdateDraftDto {
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() content?: Record<string, unknown>;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() answerSchema?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) taskType?: string;
}

export class TaskBankListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ type: Number, default: 50, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class CreateCurriculumMappingDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() workspaceId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() taskSourceId!: string;
  @ApiProperty({ enum: ['subject', 'course', 'topic', 'skill', 'category', 'section'] }) @IsIn(['subject', 'course', 'topic', 'skill', 'category', 'section']) mappingType!: CurriculumMappingType;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(240) externalValue!: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() topicId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() skillId?: string;
}

export class CurriculumMappingQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() workspaceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() taskSourceId?: string;
  @ApiPropertyOptional({ type: Number, default: 50, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class ExternalResultObservationDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) externalLearnerId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() taskSourceId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) externalTaskId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) idempotencyKey!: string;
  @ApiPropertyOptional({ enum: ['correct', 'incorrect', 'invalid'] }) @IsOptional() @IsIn(['correct', 'incorrect', 'invalid']) outcome?: 'correct' | 'incorrect' | 'invalid';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) score?: number;
  @ApiProperty() @IsDateString() observedAt!: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() sourceMetadata?: Record<string, unknown>;
}

export class PublicAnswerSchemaDto {
  @ApiPropertyOptional({ example: 'single-choice' }) type?: string;
  @ApiPropertyOptional({ example: true }) required?: boolean;
  @ApiProperty({ example: 'automatic' }) evaluatorCapability!: string;
}

export class TaskSourceResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) integrationId!: string | null;
  @ApiProperty({ example: 'Kompege bank' }) name!: string;
  @ApiProperty({ example: 'kompege' }) sourceType!: string;
  @ApiProperty({ enum: ['imported_snapshot', 'external_reference'] }) mode!: string;
  @ApiProperty({ enum: ['active', 'disabled'] }) status!: string;
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata!: Record<string, unknown>;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class TaskVersionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) taskId!: string;
  @ApiProperty({ example: 3 }) version!: number;
  @ApiProperty({ example: 'single-choice' }) taskType!: string;
  @ApiProperty({ enum: ['draft', 'published', 'archived'] }) status!: string;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Sanitized task content. Answer keys such as correctOptionId are never included.',
  })
  content!: Record<string, unknown>;
  @ApiProperty({ type: PublicAnswerSchemaDto }) answerSchema!: PublicAnswerSchemaDto;
  @ApiProperty({ example: 'automatic' }) evaluatorCapability!: string;
  @ApiProperty({ example: 'single-choice.v1' }) evaluationRule!: string;
  @ApiProperty({ type: 'object', additionalProperties: true, description: 'Origin of the version (source, snapshot, edit history).' })
  provenance!: Record<string, unknown>;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) rawSnapshotId!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

export class ImportedTaskVersionResponseDto extends TaskVersionResponseDto {
  @ApiProperty({ description: 'True when the same idempotencyKey was replayed instead of importing again.' })
  idempotentReplay!: boolean;
}

export class TaskAnswerResponseDto {
  @ApiProperty({ format: 'uuid' }) taskVersionId!: string;
  @ApiProperty({ type: PublicAnswerSchemaDto }) answerSchema!: PublicAnswerSchemaDto;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Answer key for the version, for example { "optionId": "a" }. Null when the task is not auto-graded.',
  })
  answer!: Record<string, unknown> | null;
}

export class CurriculumMappingResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ format: 'uuid' }) taskSourceId!: string;
  @ApiProperty({ enum: ['subject', 'course', 'topic', 'skill', 'category', 'section'] }) mappingType!: string;
  @ApiProperty({ example: 'algebra' }) externalValue!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) subjectId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) courseId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) topicId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) skillId!: string | null;
  @ApiProperty({ enum: ['mapped', 'unmapped'], description: 'mapped once at least one curriculum target resolved.' }) status!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class ExternalResultObservationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'learner-42' }) externalLearnerId!: string;
  @ApiProperty({ format: 'uuid' }) taskSourceId!: string;
  @ApiProperty({ example: 'kompege-1001' }) externalTaskId!: string;
  @ApiProperty({ format: 'uuid' }) taskVersionId!: string;
  @ApiProperty({ enum: ['correct', 'incorrect', 'invalid'], nullable: true }) outcome!: string | null;
  @ApiProperty({ nullable: true }) score!: number | null;
  @ApiProperty({ type: String, format: 'date-time' }) observedAt!: Date;
  @ApiProperty({ type: 'object', additionalProperties: true }) sourceMetadata!: Record<string, unknown>;
  @ApiProperty({ enum: ['recorded', 'skipped_skill_unmapped'] }) learningHandoff!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ description: 'True when the same idempotencyKey was replayed.' }) idempotentReplay!: boolean;
}
