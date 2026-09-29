import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import type { TenantContext } from '../core/core.types';
import { AiTraceResponseDto } from './ai-trace.dto';
import { AiRuntime } from './ai-runtime.service';

@ApiTags('ai')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'API key lacks the required integration scope.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/ai-requests')
export class AiTraceController {
  constructor(private readonly runtime: AiRuntime) {}

  @Get()
  @RequireIntegrationScopes('external_users:read')
  @ApiOperation({
    summary: 'List recent AI request diagnostics',
    description: 'Auth: workspace API key (Authorization: Bearer) with scope external_users:read. Returns the 20 most recent AI requests visible to this integration, with provider, model, latency, knowledge references, and outcome. Prompts, outputs, and answers are never exposed.',
  })
  @ApiOkResponse({ description: 'Recent AI request diagnostics, newest first.', type: AiTraceResponseDto, isArray: true })
  async list(@CurrentTenantContext() context: TenantContext) {
    return this.runtime.listRecent(context);
  }
}
