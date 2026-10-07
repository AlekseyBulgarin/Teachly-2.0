import { ApiProperty } from '@nestjs/swagger';

export class AiStatusResponseDto {
  @ApiProperty({ description: 'Whether a real or explicitly selected test provider is ready for requests.' })
  configured!: boolean;

  @ApiProperty({ example: 'openai', description: 'Safe provider label. Credentials are never returned.' })
  provider!: string;

  @ApiProperty({ nullable: true, example: 'gpt-4o-mini' })
  model!: string | null;

  @ApiProperty({ enum: ['responses', 'chat_completions'], nullable: true })
  apiMode!: 'responses' | 'chat_completions' | null;
}
