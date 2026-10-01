import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
  @ApiProperty({ type: Object }) @IsObject() answer!: Record<string, unknown>;
}

export class TrainerSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['active', 'completed'] }) status!: string;
  @ApiProperty({ type: Object }) filters!: Record<string, string | null>;
  @ApiProperty({ type: Object }) progress!: { completed: number; total: number };
  @ApiPropertyOptional({ type: Object, nullable: true }) current!: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: Object, nullable: true }) latestResult!: Record<string, unknown> | null;
  @ApiProperty() canComplete!: boolean;
  @ApiProperty() idempotentReplay!: boolean;
}
