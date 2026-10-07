import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import { AiRuntime } from './ai-runtime.service';
import { AiStatusResponseDto } from './ai-status.dto';

@ApiTags('ai')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'API key lacks remediation:write.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/ai')
export class AiStatusController {
  constructor(private readonly runtime: AiRuntime) {}

  @Get('status')
  @RequireIntegrationScopes('remediation:write')
  @ApiOperation({
    summary: 'Read safe AI provider readiness',
    description: 'Returns only provider readiness, safe provider label, model, and API mode. Credentials and endpoints are never exposed.',
  })
  @ApiOkResponse({ type: AiStatusResponseDto })
  status(): AiStatusResponseDto {
    return this.runtime.status();
  }
}
