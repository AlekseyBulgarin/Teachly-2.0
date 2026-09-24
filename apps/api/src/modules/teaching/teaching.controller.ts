import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsUUID, IsString, MinLength } from 'class-validator';
import { CurrentPrincipal } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { TeachingService } from './teaching.service';

class CreateStudentDto {
  @IsString()
  @MinLength(1)
  displayName!: string;
}

class CreateAssignmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  taskVersionId!: string;
}

@Controller()
export class TeachingController {
  constructor(private readonly teaching: TeachingService) {}

  @Get('students')
  async listStudents(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.teaching.listStudents(principal.userId);
  }

  @Post('students')
  async createStudent(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: CreateStudentDto) {
    return this.teaching.createStudent(principal.userId, body.displayName);
  }

  @Post('assignments')
  async createAssignment(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: CreateAssignmentDto) {
    return this.teaching.createAssignment(principal.userId, body.studentId, body.taskVersionId);
  }

  @Get('assignments')
  async listAssignments(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const rows = await this.teaching.listAssignmentsForStudent(principal.userId);
    return rows.map((row) => ({ ...row, taskVersion: this.teaching.toPublicTaskVersion(row.taskVersion) }));
  }

  @Get('students/:studentId/results')
  async listResults(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('studentId') studentId: string) {
    return this.teaching.listResultsForTeacher(principal.userId, studentId);
  }
}
