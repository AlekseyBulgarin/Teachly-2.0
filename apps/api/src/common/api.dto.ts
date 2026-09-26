import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiPropertyOptional({ type: [String] })
  details?: string[];

  @ApiProperty({ example: 'phase-2-contract-test' })
  requestId!: string;
}
