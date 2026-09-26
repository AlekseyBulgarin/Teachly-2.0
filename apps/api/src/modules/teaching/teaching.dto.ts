import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';
import { PublicTaskVersionDto } from '../education/education.dto';
import type { AssignmentView, StudentAssignmentItem, StudentRelationshipItem, StudentView } from './teaching.types';

export class CreateStudentDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  displayName!: string;
}

export class CreateAssignmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskVersionId!: string;
}

export class StudentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['student'] })
  type!: 'student';

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static from(student: StudentView): StudentDto {
    return { ...student };
  }
}

export class StudentRelationshipDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['active', 'revoked'] })
  status!: 'active' | 'revoked';

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class StudentRelationshipResponseDto {
  @ApiProperty({ type: StudentDto })
  student!: StudentDto;

  @ApiProperty({ type: StudentRelationshipDto })
  relationship!: StudentRelationshipDto;

  static from(item: StudentRelationshipItem): StudentRelationshipResponseDto {
    return { student: StudentDto.from(item.student), relationship: item.relationship };
  }
}

export class AssignmentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  taskVersionId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static from(assignment: AssignmentView): AssignmentDto {
    return { ...assignment };
  }
}

export class StudentAssignmentResponseDto {
  @ApiProperty({ type: AssignmentDto })
  assignment!: AssignmentDto;

  @ApiProperty({ type: PublicTaskVersionDto })
  taskVersion!: PublicTaskVersionDto;

  static from(item: StudentAssignmentItem): StudentAssignmentResponseDto {
    return {
      assignment: AssignmentDto.from(item.assignment),
      taskVersion: PublicTaskVersionDto.from(item.taskVersion),
    };
  }
}
