import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import type { TenantContext } from '../integrations/integrations.types';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@ApiSecurity('workspace-api-key')
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get('status')
  @RequireIntegrationScopes('external_users:read')
  @ApiOkResponse({ description: 'Tenant-scoped knowledge status', type: Object, isArray: true })
  async status(@CurrentTenantContext() context: TenantContext) {
    return this.knowledge.listStatus(context);
  }
}
