import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { CurrentPrincipal, OptionalTenantContext } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import type { TenantContext } from '../integrations/integrations.types';
import { TeachingService } from './teaching.service';
import {
  AssignmentDto,
  CreateAssignmentDto,
  CreateStudentDto,
  StudentAssignmentResponseDto,
  StudentDto,
  StudentRelationshipResponseDto,
} from './teaching.dto';

@ApiTags('teaching')
@ApiBadRequestResponse({ type: ApiErrorDto })
@Controller()
export class TeachingController {
  constructor(private readonly teaching: TeachingService) {}

  @Get('students')
  @ApiOkResponse({ type: [StudentRelationshipResponseDto] })
  async listStudents(@CurrentPrincipal() principal: AuthenticatedPrincipal): Promise<StudentRelationshipResponseDto[]> {
    return (await this.teaching.listStudents(principal.userId)).map(StudentRelationshipResponseDto.from);
  }

  @Post('students')
  @ApiCreatedResponse({ type: StudentDto })
  async createStudent(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: CreateStudentDto): Promise<StudentDto> {
    return StudentDto.from(await this.teaching.createStudent(principal.userId, body.displayName));
  }

  @Post('assignments')
  @ApiCreatedResponse({ type: AssignmentDto })
  async createAssignment(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @OptionalTenantContext() context: TenantContext | undefined,
    @Body() body: CreateAssignmentDto,
  ): Promise<AssignmentDto> {
    return AssignmentDto.from(await this.teaching.createAssignment(principal.userId, body.studentId, body.taskVersionId, context));
  }

  @Get('assignments')
  @ApiOkResponse({ type: [StudentAssignmentResponseDto] })
  async listAssignments(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @OptionalTenantContext() context?: TenantContext,
  ): Promise<StudentAssignmentResponseDto[]> {
    return (await this.teaching.listAssignmentsForStudent(principal.userId, context)).map(StudentAssignmentResponseDto.from);
  }
}
