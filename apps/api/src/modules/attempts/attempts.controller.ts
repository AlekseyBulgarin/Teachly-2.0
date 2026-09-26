import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { CurrentPrincipal } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { AttemptsService } from './attempts.service';
import {
  AttemptResultResponseDto,
  StartAttemptDto,
  StartAttemptResponseDto,
  SubmitAnswerDto,
  SubmitAnswerResponseDto,
} from './attempts.dto';

@ApiTags('attempts')
@ApiBadRequestResponse({ type: ApiErrorDto })
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post()
  @ApiCreatedResponse({ type: StartAttemptResponseDto })
  async start(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: StartAttemptDto): Promise<StartAttemptResponseDto> {
    if (principal.userType !== 'student') throw new ForbiddenException('Only students can start attempts');
    return StartAttemptResponseDto.from(await this.attempts.start(principal.userId, body.taskVersionId, body.assignmentId));
  }

  @Post(':attemptId/submissions')
  @ApiCreatedResponse({ type: SubmitAnswerResponseDto })
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  async submit(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() body: SubmitAnswerDto): Promise<SubmitAnswerResponseDto> {
    if (principal.userType !== 'student') throw new ForbiddenException('Only students can submit attempts');
    return SubmitAnswerResponseDto.from(await this.attempts.submit(principal.userId, attemptId, body.idempotencyKey, body.answer));
  }

  @Get(':attemptId/result')
  @ApiOkResponse({ type: AttemptResultResponseDto })
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  async result(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('attemptId', ParseUUIDPipe) attemptId: string): Promise<AttemptResultResponseDto> {
    return AttemptResultResponseDto.from(await this.attempts.getResult(principal.userId, attemptId));
  }
}

@ApiTags('teaching')
@ApiBadRequestResponse({ type: ApiErrorDto })
@Controller('students')
export class TeacherResultsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Get(':studentId/results')
  @ApiOkResponse({ type: [AttemptResultResponseDto] })
  @ApiParam({ name: 'studentId', format: 'uuid' })
  async listResults(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('studentId', ParseUUIDPipe) studentId: string): Promise<AttemptResultResponseDto[]> {
    return (await this.attempts.listResultsForTeacher(principal.userId, studentId)).map(AttemptResultResponseDto.from);
  }
}
