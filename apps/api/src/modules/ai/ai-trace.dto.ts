import { ApiProperty } from '@nestjs/swagger';

export class AiTraceResponseDto {
  @ApiProperty({ format: 'uuid' }) requestId!: string;

  @ApiProperty({ example: 'grounded_remediation' }) capability!: string;

  @ApiProperty({ enum: ['started', 'succeeded', 'failed'] }) status!: string;

  @ApiProperty({ nullable: true, example: 'openai' }) provider!: string | null;

  @ApiProperty({ nullable: true, example: 'gpt-4o-mini' }) model!: string | null;

  @ApiProperty({ nullable: true, example: 842 }) latencyMs!: number | null;

  @ApiProperty({ type: [String], description: 'Approved knowledge version ids the model was allowed to cite.' })
  knowledgeReferences!: string[];

  @ApiProperty({ enum: ['completed', 'abstained'], nullable: true, description: 'Null when the request did not produce a structured output.' })
  outcome!: string | null;

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true }) completedAt!: Date | null;
}
