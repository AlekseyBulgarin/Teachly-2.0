import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import type { TenantContext } from '../integrations/integrations.types';
import { AiRuntime } from './ai-runtime.service';

@ApiTags('ai')
@ApiSecurity('workspace-api-key')
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/ai-requests')
export class AiTraceController {
  constructor(private readonly runtime: AiRuntime) {}

  @Get()
  @RequireIntegrationScopes('external_users:read')
  @ApiOkResponse({ description: 'Safe recent AI request diagnostics', type: Object, isArray: true })
  async list(@CurrentTenantContext() context: TenantContext) {
    return this.runtime.listRecent(context.workspaceId);
  }
}
