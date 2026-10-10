import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { OptionalTenantContext } from '../../common/request-context';
import type { TenantContext } from '../core/core.types';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import { CreateTrainerSessionDto, SubmitTrainerAnswerDto, TrainerSessionResponseDto, TrainerSubmissionResponseDto } from './trainer.dto';
import { TrainerService } from './trainer.service';

@ApiTags('trainer')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Workspace API key required.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'Missing Trainer scope or cross-workspace access.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/trainer')
export class TrainerController {
  constructor(private readonly trainer: TrainerService) {}

  @Post('sessions')
  @RequireIntegrationScopes('trainer:write')
  @ApiOperation({ summary: 'Create an idempotent trainer session for an integration-bound external learner' })
  @ApiCreatedResponse({ type: TrainerSessionResponseDto })
  create(@Body() body: CreateTrainerSessionDto, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.create(tenant, body);
  }

  @Get('sessions/:sessionId')
  @RequireIntegrationScopes('trainer:read')
  @ApiOperation({ summary: 'Read trainer session progress and current published task' })
  @ApiOkResponse({ type: TrainerSessionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  get(@Param('sessionId', ParseUUIDPipe) sessionId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.get(tenant, sessionId);
  }

  @Get('sessions/:sessionId/current')
  @RequireIntegrationScopes('trainer:read')
  @ApiOperation({ summary: 'Start, if needed, and return the current published trainer task' })
  @ApiOkResponse({ type: TrainerSessionResponseDto })
  current(@Param('sessionId', ParseUUIDPipe) sessionId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.current(tenant, sessionId);
  }

  @Post('sessions/:sessionId/submissions')
  @RequireIntegrationScopes('trainer:write')
  @ApiOperation({ summary: 'Submit an answer for a trainer item using the existing deterministic Assessment evaluator' })
  @ApiCreatedResponse({ type: TrainerSubmissionResponseDto })
  submit(@Param('sessionId', ParseUUIDPipe) sessionId: string, @Body() body: SubmitTrainerAnswerDto, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.submit(tenant, sessionId, body);
  }

  @Post('sessions/:sessionId/next')
  @HttpCode(HttpStatus.OK)
  @RequireIntegrationScopes('trainer:write')
  @ApiOperation({ summary: 'Advance to the next trainer task after the current task is submitted' })
  @ApiOkResponse({ type: TrainerSessionResponseDto })
  next(@Param('sessionId', ParseUUIDPipe) sessionId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.next(tenant, sessionId);
  }

  @Post('sessions/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  @RequireIntegrationScopes('trainer:write')
  @ApiOperation({ summary: 'Complete a trainer session after every session task has been submitted' })
  @ApiOkResponse({ type: TrainerSessionResponseDto })
  complete(@Param('sessionId', ParseUUIDPipe) sessionId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.trainer.complete(tenant, sessionId);
  }
}
