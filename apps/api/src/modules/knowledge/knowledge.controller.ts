import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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
import { KnowledgeStatusQueryDto, KnowledgeStatusResponseDto } from './knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'API key lacks the required integration scope.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get('status')
  @RequireIntegrationScopes('external_users:read')
  @ApiOperation({
    summary: 'List knowledge source, document, and version status',
    description: 'Auth: workspace API key (Authorization: Bearer) with scope external_users:read. One row per knowledge document version in the API key workspace, including license and external-AI permission.',
  })
  @ApiOkResponse({ description: 'Knowledge status rows for the workspace, newest version first.', type: KnowledgeStatusResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Integration is not active in this workspace.', type: ApiErrorDto })
  async status(
    @CurrentTenantContext() context: TenantContext,
    @Query() query: KnowledgeStatusQueryDto,
  ) {
    return this.knowledge.listStatus(context, query.limit);
  }
}
