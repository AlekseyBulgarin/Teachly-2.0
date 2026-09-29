import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiSecurity,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentRequestId, CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import type { TenantContext } from '../core/core.types';
import { PartnerRemediationRequestDto, PartnerRemediationResponseDto } from './partner-remediation.dto';
import { PartnerRemediationService } from './partner-remediation.service';

@ApiTags('remediations')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ description: 'Validation failure or malformed request body.', type: ApiErrorDto })
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'API key lacks external_users:read or remediation:write, or the context is not permitted for AI.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/remediations')
export class PartnerRemediationController {
  constructor(private readonly remediations: PartnerRemediationService) {}

  @Post()
  @RequireIntegrationScopes('external_users:read', 'remediation:write')
  @ApiOperation({
    summary: 'Generate a grounded remediation for an attempt',
    description: 'Auth: workspace API key (Authorization: Bearer) with scopes external_users:read and remediation:write. Runs the AiRuntime against the authoritative attempt and approved knowledge; scoring, attempts, and learning state are never modified. Replaying the same idempotencyKey returns the stored result. The model may abstain (abstained=true) when context is insufficient.',
  })
  @ApiCreatedResponse({ description: 'Generated (or replayed) remediation.', type: PartnerRemediationResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ type: ApiErrorDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorDto })
  async create(
    @CurrentTenantContext() context: TenantContext,
    @CurrentRequestId() requestId: string,
    @Body() body: PartnerRemediationRequestDto,
  ): Promise<PartnerRemediationResponseDto> {
    return PartnerRemediationResponseDto.from(await this.remediations.execute(context, body, requestId));
  }
}
