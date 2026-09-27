import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentPrincipal, OptionalTenantContext } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import type { TenantContext } from '../integrations/integrations.types';
import { LearningService } from './learning.service';

@ApiTags('learning')
@Controller('students')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get(':studentId/learning-state')
  @ApiParam({ name: 'studentId', format: 'uuid' })
  @ApiQuery({ name: 'skillId', format: 'uuid' })
  @ApiOkResponse({ description: 'Teacher-authorized deterministic learning state', type: Object })
  async state(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('skillId', ParseUUIDPipe) skillId: string,
    @OptionalTenantContext() context?: TenantContext,
  ) {
    return this.learning.getLearningStateForTeacher(principal.userId, studentId, skillId, context);
  }
}
