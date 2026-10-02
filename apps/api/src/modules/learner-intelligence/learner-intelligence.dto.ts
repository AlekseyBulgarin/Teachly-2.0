import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class LearnerProfileQueryDto {
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) recentLimit = 10;
}

export class LearnerProgressQueryDto {
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsIn(['skill', 'topic', 'course', 'subject']) groupBy: 'skill' | 'topic' | 'course' | 'subject' = 'skill';
}

export class LearnerSkillsQueryDto {
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @IsOptional() @IsIn(['insufficient_evidence', 'needs_practice', 'showing_progress'])
  status?: 'insufficient_evidence' | 'needs_practice' | 'showing_progress';
  @IsOptional() @IsString() @MaxLength(500) cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class LearnerActivityQueryDto {
  @IsString() @MinLength(1) @MaxLength(200) externalUserId!: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() @MaxLength(500) cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
