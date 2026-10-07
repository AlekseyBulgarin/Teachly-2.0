import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ResultDto, SubmitAnswerResponseDto } from '../attempts/attempts.dto';
import { PublicTaskVersionDto } from '../education/education.dto';

export class CreateTrainerSessionDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) externalLearnerId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) idempotencyKey!: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() topicId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() skillId?: string;
  @ApiPropertyOptional({ type: [String], format: 'uuid' }) @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID('4', { each: true }) taskIds?: string[];
}

export class SubmitTrainerAnswerDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() itemId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) idempotencyKey!: string;
  @ApiProperty({ type: 'object', additionalProperties: true }) @IsObject() answer!: Record<string, unknown>;
}

export class TrainerFiltersDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) subjectId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) courseId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) topicId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) skillId!: string | null;
}

export class TrainerProgressDto {
  @ApiProperty() completed!: number;
  @ApiProperty() total!: number;
}

export class TrainerItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ enum: ['pending', 'started', 'submitted'] }) status!: string;
  @ApiProperty({ type: PublicTaskVersionDto }) task!: PublicTaskVersionDto;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) attemptId!: string | null;
  @ApiProperty({ type: ResultDto, nullable: true }) result!: ResultDto | null;
}

export class TrainerSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['active', 'completed'] }) status!: string;
  @ApiProperty({ type: TrainerFiltersDto }) filters!: TrainerFiltersDto;
  @ApiProperty({ type: TrainerProgressDto }) progress!: TrainerProgressDto;
  @ApiPropertyOptional({ type: TrainerItemDto, nullable: true }) current!: TrainerItemDto | null;
  @ApiPropertyOptional({ type: ResultDto, nullable: true }) latestResult!: ResultDto | null;
  @ApiProperty() canComplete!: boolean;
  @ApiProperty() idempotentReplay!: boolean;
}

export class TrainerSubmissionResponseDto {
  @ApiProperty({ type: SubmitAnswerResponseDto }) submitted!: SubmitAnswerResponseDto;
  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } }) theory!: Array<Record<string, unknown>>;
  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true }) teacherSignal!: Record<string, unknown> | null;
  @ApiProperty({ type: TrainerSessionResponseDto }) session!: TrainerSessionResponseDto;
}
