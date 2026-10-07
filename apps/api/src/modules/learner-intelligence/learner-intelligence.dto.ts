import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class LearnerProfileQueryDto {
  @ApiProperty({ example: 'learner-42' })
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @ApiPropertyOptional({ type: Number, default: 10, minimum: 1, maximum: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) recentLimit = 10;
}

export class LearnerProgressQueryDto {
  @ApiProperty({ example: 'learner-42' })
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ enum: ['skill', 'topic', 'course', 'subject'], default: 'skill' })
  @IsOptional() @IsIn(['skill', 'topic', 'course', 'subject']) groupBy: 'skill' | 'topic' | 'course' | 'subject' = 'skill';
}

export class LearnerSkillsQueryDto {
  @ApiProperty({ example: 'learner-42' })
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @ApiPropertyOptional({ enum: ['insufficient_evidence', 'needs_practice', 'showing_progress'] })
  @IsOptional() @IsIn(['insufficient_evidence', 'needs_practice', 'showing_progress'])
  status?: 'insufficient_evidence' | 'needs_practice' | 'showing_progress';
  @ApiPropertyOptional({ description: 'Opaque cursor returned by the previous page.' })
  @IsOptional() @IsString() @MaxLength(500) cursor?: string;
  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class LearnerActivityQueryDto {
  @ApiProperty({ example: 'learner-42' })
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ description: 'Opaque cursor returned by the previous page.' })
  @IsOptional() @IsString() @MaxLength(500) cursor?: string;
  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class LearnerReferenceDto {
  @ApiProperty({ example: 'learner-42' }) externalUserId!: string;
  @ApiProperty({ enum: ['active', 'disabled'] }) status!: string;
}

export class OutcomeSummaryDto {
  @ApiProperty() evidenceCount!: number;
  @ApiProperty() correct!: number;
  @ApiProperty() incorrect!: number;
  @ApiProperty() invalid!: number;
  @ApiProperty({ nullable: true, example: 0.75 }) outcomeRate!: number | null;
}

export class ProfileActivitySummaryDto extends OutcomeSummaryDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) firstObservedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastObservedAt!: Date | null;
  @ApiProperty() activeDays!: number;
}

export class AttemptSummaryDto {
  @ApiProperty() started!: number;
  @ApiProperty() submitted!: number;
  @ApiProperty() evaluated!: number;
  @ApiProperty() correct!: number;
  @ApiProperty() incorrect!: number;
  @ApiProperty() invalid!: number;
  @ApiProperty() mappedResults!: number;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) firstStartedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastActivityAt!: Date | null;
  @ApiProperty({ nullable: true, example: 0.75 }) outcomeRate!: number | null;
}

export class MappingCoverageDto {
  @ApiProperty() evaluatedResults!: number;
  @ApiProperty() withSkillEvidence!: number;
}

export class SkillStateBreakdownDto {
  @ApiProperty() insufficient_evidence!: number;
  @ApiProperty() needs_practice!: number;
  @ApiProperty() showing_progress!: number;
}

export class SkillStateCountsDto {
  @ApiProperty() observed!: number;
  @ApiProperty({ type: SkillStateBreakdownDto }) byStatus!: SkillStateBreakdownDto;
}

export class CurriculumSubjectDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class CurriculumEntityDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
}

export class CurriculumDescriptorDto {
  @ApiProperty({ type: CurriculumSubjectDto }) subject!: CurriculumSubjectDto;
  @ApiProperty({ type: CurriculumEntityDto }) course!: CurriculumEntityDto;
  @ApiProperty({ type: CurriculumEntityDto }) topic!: CurriculumEntityDto;
  @ApiProperty({ type: CurriculumEntityDto }) skill!: CurriculumEntityDto;
}

export class PublicSkillStateDto {
  @ApiProperty({ enum: ['learning_state.v1'] }) rule!: 'learning_state.v1';
  @ApiProperty({ enum: ['insufficient_evidence', 'needs_practice', 'showing_progress'] }) status!: string;
  @ApiProperty() evidenceCount!: number;
  @ApiProperty({ type: [String], enum: ['correct', 'incorrect', 'invalid'] }) recentOutcomes!: string[];
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastObservedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) asOf!: Date;
}

export class PublicSkillTrendDto {
  @ApiProperty({ enum: ['learning_trend.v1'] }) rule!: 'learning_trend.v1';
  @ApiProperty({ enum: ['improving', 'stable', 'declining', 'insufficient_evidence'] }) status!: string;
  @ApiProperty() currentCorrect!: number;
  @ApiProperty() previousCorrect!: number;
}

export class LearnerSkillDto {
  @ApiProperty({ type: CurriculumDescriptorDto }) curriculum!: CurriculumDescriptorDto;
  @ApiProperty({ type: PublicSkillStateDto }) state!: PublicSkillStateDto;
  @ApiProperty({ type: PublicSkillTrendDto }) trend!: PublicSkillTrendDto;
  @ApiProperty({ type: OutcomeSummaryDto }) window!: OutcomeSummaryDto;
  @ApiProperty() taskEvidenceCount!: number;
  @ApiProperty() trainerEvidenceCount!: number;
}

export class TrainerSummaryDto {
  @ApiProperty() sessionsStarted!: number;
  @ApiProperty() sessionsCompleted!: number;
  @ApiProperty() itemsSubmitted!: number;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastActivityAt!: Date | null;
}

export class LearnerActivityItemDto {
  @ApiProperty({ type: String, format: 'date-time' }) occurredAt!: Date;
  @ApiProperty({ enum: ['assessment', 'trainer', 'external_observation'] }) origin!: string;
  @ApiProperty({ enum: ['correct', 'incorrect', 'invalid'] }) outcome!: string;
  @ApiProperty({ type: CurriculumDescriptorDto }) curriculum!: CurriculumDescriptorDto;
}

export class LearnerProfileResponseDto {
  @ApiProperty({ type: LearnerReferenceDto }) learner!: LearnerReferenceDto;
  @ApiProperty({ type: String, format: 'date-time' }) asOf!: Date;
  @ApiProperty({ type: ProfileActivitySummaryDto }) activity!: ProfileActivitySummaryDto;
  @ApiProperty({ type: AttemptSummaryDto }) attempts!: AttemptSummaryDto;
  @ApiProperty({ type: MappingCoverageDto }) mappingCoverage!: MappingCoverageDto;
  @ApiProperty({ type: SkillStateCountsDto }) skills!: SkillStateCountsDto;
  @ApiProperty({ type: [LearnerSkillDto] }) strengths!: LearnerSkillDto[];
  @ApiProperty({ type: [LearnerSkillDto] }) needsPractice!: LearnerSkillDto[];
  @ApiProperty({ type: TrainerSummaryDto }) trainer!: TrainerSummaryDto;
  @ApiProperty({ type: [LearnerActivityItemDto] }) recentActivity!: LearnerActivityItemDto[];
}

export class DateRangeDto {
  @ApiProperty({ type: String, format: 'date-time' }) from!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) to!: Date;
}

export class DailyActivityDto {
  @ApiProperty({ example: '2026-10-07' }) date!: string;
  @ApiProperty() evidenceCount!: number;
}

export class SkillTrendItemDto {
  @ApiProperty({ type: CurriculumDescriptorDto }) curriculum!: CurriculumDescriptorDto;
  @ApiProperty({ type: PublicSkillTrendDto }) trend!: PublicSkillTrendDto;
}

export class LearnerProgressResponseDto {
  @ApiProperty({ type: LearnerReferenceDto }) learner!: LearnerReferenceDto;
  @ApiProperty({ type: String, format: 'date-time' }) asOf!: Date;
  @ApiProperty({ type: DateRangeDto }) window!: DateRangeDto;
  @ApiProperty({ type: OutcomeSummaryDto }) summary!: OutcomeSummaryDto;
  @ApiProperty({ type: MappingCoverageDto }) mappingCoverage!: MappingCoverageDto;
  @ApiProperty({ type: SkillStateCountsDto }) skillStates!: SkillStateCountsDto;
  @ApiProperty({ type: [DailyActivityDto] }) activityByDay!: DailyActivityDto[];
  @ApiProperty({ enum: ['skill', 'topic', 'course', 'subject'] }) groupBy!: string;
  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } }) dimensions!: Array<Record<string, unknown>>;
  @ApiProperty({ type: [SkillTrendItemDto] }) recentOutcomeTrend!: SkillTrendItemDto[];
}

export class LearnerSkillsResponseDto {
  @ApiProperty({ type: LearnerReferenceDto }) learner!: LearnerReferenceDto;
  @ApiProperty({ type: String, format: 'date-time' }) asOf!: Date;
  @ApiProperty({ type: [LearnerSkillDto] }) items!: LearnerSkillDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}

export class LearnerActivityResponseDto {
  @ApiProperty({ type: LearnerReferenceDto }) learner!: LearnerReferenceDto;
  @ApiProperty({ type: [LearnerActivityItemDto] }) items!: LearnerActivityItemDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}
