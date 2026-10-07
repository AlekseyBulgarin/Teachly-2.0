import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import type { TenantContext } from '../core/core.types';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import {
  LearnerActivityQueryDto,
  LearnerActivityResponseDto,
  LearnerProfileQueryDto,
  LearnerProfileResponseDto,
  LearnerProgressQueryDto,
  LearnerProgressResponseDto,
  LearnerSkillsQueryDto,
  LearnerSkillsResponseDto,
} from './learner-intelligence.dto';
import { LearnerIntelligenceService } from './learner-intelligence.service';

@ApiTags('learner-intelligence')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Workspace API key required.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'API key lacks learner_intelligence:read.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@RequireIntegrationScopes('learner_intelligence:read')
@Controller('v1/learner-intelligence')
export class LearnerIntelligenceController {
  constructor(private readonly intelligence: LearnerIntelligenceService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Read an integration-scoped external learner profile' })
  @ApiOkResponse({ type: LearnerProfileResponseDto })
  profile(@CurrentTenantContext() tenant: TenantContext, @Query() query: LearnerProfileQueryDto) {
    return this.intelligence.profile(tenant, query);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Read deterministic learner progress over a bounded time window' })
  @ApiOkResponse({ type: LearnerProgressResponseDto })
  progress(@CurrentTenantContext() tenant: TenantContext, @Query() query: LearnerProgressQueryDto) {
    return this.intelligence.progress(tenant, query);
  }

  @Get('skills')
  @ApiOperation({ summary: 'List observed deterministic learner skill states' })
  @ApiOkResponse({ type: LearnerSkillsResponseDto })
  skills(@CurrentTenantContext() tenant: TenantContext, @Query() query: LearnerSkillsQueryDto) {
    return this.intelligence.skills(tenant, query);
  }

  @Get('activity')
  @ApiOperation({ summary: 'List integration-scoped learner result activity' })
  @ApiOkResponse({ type: LearnerActivityResponseDto })
  activity(@CurrentTenantContext() tenant: TenantContext, @Query() query: LearnerActivityQueryDto) {
    return this.intelligence.activity(tenant, query);
  }
}
