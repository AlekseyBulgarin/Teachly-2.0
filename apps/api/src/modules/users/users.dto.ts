import { ApiProperty } from '@nestjs/swagger';
import type { UserView } from './users.types';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['teacher', 'student'] })
  type!: 'teacher' | 'student';

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static from(user: UserView): UserResponseDto {
    return { ...user };
  }
}
