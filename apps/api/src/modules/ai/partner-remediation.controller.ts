import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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
import type { TenantContext } from '../integrations/integrations.types';
import { PartnerRemediationRequestDto, PartnerRemediationResponseDto } from './partner-remediation.dto';
import { PartnerRemediationService } from './partner-remediation.service';

@ApiTags('remediations')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ type: ApiErrorDto })
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@ApiForbiddenResponse({ type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/remediations')
export class PartnerRemediationController {
  constructor(private readonly remediations: PartnerRemediationService) {}

  @Post()
  @RequireIntegrationScopes('external_users:read', 'remediation:write')
  @ApiCreatedResponse({ type: PartnerRemediationResponseDto })
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
