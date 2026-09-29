import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from './api-key.guard';
import type { TenantContext } from '../core/core.types';
import { IntegrationsService } from './integrations.service';
import { RequireIntegrationScopes } from './scope.decorator';

@ApiTags('integrations')
@ApiSecurity('workspace-api-key')
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/integration')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequireIntegrationScopes('external_users:read')
  @ApiOkResponse({ description: 'Current integration metadata', type: Object })
  async current(@CurrentTenantContext() context: TenantContext) {
    const integration = await this.integrations.getCurrent(context);
    return {
      id: integration.id,
      name: integration.name,
      organizationId: integration.organizationId,
      workspaceId: integration.workspaceId,
      status: integration.status,
      scopes: context.scopes,
      createdAt: integration.createdAt,
    };
  }
}
