import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { AiExecutionResult } from './ai.types';

export class PartnerRemediationRequestDto {
  @ApiProperty({ minLength: 1, maxLength: 255, example: 'learner-42' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  externalUserId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  attemptId!: string;

  @ApiPropertyOptional({ maxLength: 1_000 })
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  learnerQuestion?: string;

  @ApiProperty({ minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  idempotencyKey!: string;
}

export class PartnerRemediationContentDto {
  @ApiProperty()
  summary!: string;

  @ApiProperty()
  explanation!: string;

  @ApiProperty()
  hint!: string;

  @ApiProperty({ nullable: true })
  likelyGap!: string | null;

  @ApiProperty({ minimum: 0, maximum: 1 })
  confidence!: number;

  @ApiProperty()
  abstained!: boolean;
}

export class PartnerRemediationResponseDto {
  @ApiProperty({ format: 'uuid' })
  requestId!: string;

  @ApiProperty({ type: PartnerRemediationContentDto })
  remediation!: PartnerRemediationContentDto;

  @ApiProperty({ type: [String] })
  evidenceRefs!: string[];

  @ApiProperty({ type: [String] })
  knowledgeRefs!: string[];

  static from(result: AiExecutionResult): PartnerRemediationResponseDto {
    return {
      requestId: result.requestId,
      remediation: {
        summary: result.output.summary,
        explanation: result.output.explanation,
        hint: result.output.hint,
        likelyGap: result.output.likelyGap,
        confidence: result.output.confidence,
        abstained: result.output.abstained,
      },
      evidenceRefs: result.output.evidenceRefs,
      knowledgeRefs: result.output.knowledgeRefs,
    };
  }
}
