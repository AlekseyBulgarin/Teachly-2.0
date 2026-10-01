import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateWhiteboardDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) externalReference?: string;
}

export class UpdateWhiteboardDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) externalReference?: string;
  @ApiPropertyOptional({ enum: ['active', 'archived'] }) @IsOptional() @IsIn(['active', 'archived']) status?: 'active' | 'archived';
}

export class WhiteboardListQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'archived'] }) @IsOptional() @IsIn(['active', 'archived']) status?: 'active' | 'archived';
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class SaveWhiteboardStateDto {
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedRevision!: number;
  @ApiProperty({ type: Object }) @IsObject() data!: Record<string, unknown>;
}

export class AttachWhiteboardResourceDto {
  @ApiProperty({ enum: ['task', 'theory'] }) @IsIn(['task', 'theory']) type!: 'task' | 'theory';
  @ApiProperty({ format: 'uuid', description: 'Published task version or published theory version id' }) @IsUUID() resourceId!: string;
}

export class WhiteboardResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) externalReference!: string | null;
  @ApiProperty({ enum: ['active', 'archived'] }) status!: string;
  @ApiProperty({ minimum: 0 }) currentRevision!: number;
  @ApiProperty({ type: Date }) createdAt!: Date;
  @ApiProperty({ type: Date }) updatedAt!: Date;
}

export class WhiteboardStateResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ minimum: 0 }) revision!: number;
  @ApiPropertyOptional({ type: Object, nullable: true }) data!: Record<string, unknown> | null;
}

export class WhiteboardSaveStateResponseDto {
  @ApiProperty({ minimum: 0 }) revision!: number;
}

export class WhiteboardResourceResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['task', 'theory'] }) type!: string;
  @ApiProperty({ format: 'uuid' }) resourceId!: string;
}
