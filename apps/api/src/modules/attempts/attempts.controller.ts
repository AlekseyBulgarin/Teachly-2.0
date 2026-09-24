import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { IsObject, IsString, IsUUID, MinLength } from 'class-validator';
import { CurrentPrincipal } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { AttemptsService } from './attempts.service';

class StartAttemptDto {
  @IsUUID()
  taskVersionId!: string;

  @IsUUID()
  assignmentId!: string;
}

class SubmitAnswerDto {
  @IsString()
  @MinLength(1)
  idempotencyKey!: string;

  @IsObject()
  answer!: { optionId: string };
}

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post()
  async start(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: StartAttemptDto) {
    if (principal.userType !== 'student') throw new ForbiddenException('Only students can start attempts');
    return this.attempts.start(principal.userId, body.taskVersionId, body.assignmentId);
  }

  @Post(':attemptId/submissions')
  async submit(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('attemptId') attemptId: string, @Body() body: SubmitAnswerDto) {
    if (principal.userType !== 'student') throw new ForbiddenException('Only students can submit attempts');
    return this.attempts.submit(principal.userId, attemptId, body.idempotencyKey, body.answer);
  }

  @Get(':attemptId/result')
  async result(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('attemptId') attemptId: string) {
    return this.attempts.getResult(principal.userId, attemptId);
  }
}
