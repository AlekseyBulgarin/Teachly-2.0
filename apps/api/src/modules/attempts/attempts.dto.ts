import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { PublicTaskVersionDto } from '../education/education.dto';
import type { AttemptResult, AttemptView, ResultView, StartedAttempt, SubmittedAttempt } from './attempts.types';

export class StartAttemptDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignmentId!: string;
}

export class SingleChoiceAnswerDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  optionId!: string;
}

export class SubmitAnswerDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  idempotencyKey!: string;

  @ApiProperty({ type: SingleChoiceAnswerDto })
  @ValidateNested()
  @Type(() => SingleChoiceAnswerDto)
  answer!: SingleChoiceAnswerDto;
}

export class AttemptDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  taskVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  @ApiProperty({ enum: ['started', 'submitted'] })
  status!: 'started' | 'submitted';

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: Date | null;

  static from(attempt: AttemptView): AttemptDto {
    return { ...attempt };
  }
}

export class ResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  attemptId!: string;

  @ApiProperty({ format: 'uuid' })
  submissionId!: string;

  @ApiProperty()
  evaluationRule!: string;

  @ApiProperty({ enum: ['correct', 'incorrect', 'invalid'] })
  outcome!: 'correct' | 'incorrect' | 'invalid';

  @ApiProperty()
  isCorrect!: boolean;

  @ApiProperty()
  score!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  evaluatedAt!: Date;

  static from(result: ResultView): ResultDto {
    return { ...result };
  }
}

export class StartAttemptResponseDto {
  @ApiProperty({ type: AttemptDto })
  attempt!: AttemptDto;

  @ApiProperty({ type: PublicTaskVersionDto })
  task!: PublicTaskVersionDto;

  static from(started: StartedAttempt): StartAttemptResponseDto {
    return { attempt: AttemptDto.from(started.attempt), task: PublicTaskVersionDto.from(started.task) };
  }
}

export class SubmitAnswerResponseDto {
  @ApiProperty({ type: AttemptDto })
  attempt!: AttemptDto;

  @ApiProperty({ type: ResultDto })
  result!: ResultDto;

  @ApiProperty()
  idempotentReplay!: boolean;

  static from(submitted: SubmittedAttempt): SubmitAnswerResponseDto {
    return {
      attempt: AttemptDto.from(submitted.attempt),
      result: ResultDto.from(submitted.result),
      idempotentReplay: submitted.idempotentReplay,
    };
  }
}

export class AttemptResultResponseDto {
  @ApiProperty({ type: AttemptDto })
  attempt!: AttemptDto;

  @ApiProperty({ type: ResultDto })
  result!: ResultDto;

  static from(item: AttemptResult): AttemptResultResponseDto {
    return { attempt: AttemptDto.from(item.attempt), result: ResultDto.from(item.result) };
  }
}
