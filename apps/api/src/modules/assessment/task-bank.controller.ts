import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { Public } from '../../common/public.decorator';
import { OptionalPrincipal, OptionalTenantContext } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import type { TenantContext } from '../core/core.types';
import {
  CreateCurriculumMappingDto,
  CreateDraftDto,
  CreateTaskSourceDto,
  CurriculumMappingQueryDto,
  CurriculumMappingResponseDto,
  ExternalResultObservationDto,
  ExternalResultObservationResponseDto,
  ImportTaskDto,
  ImportedTaskVersionResponseDto,
  TaskAnswerResponseDto,
  TaskBankListQueryDto,
  TaskSourceResponseDto,
  TaskVersionResponseDto,
  UpdateDraftDto,
} from './task-bank.dto';
import { RequireTaskBankScopes } from './task-bank.scope';
import { TaskBankGuard } from './task-bank.guard';
import { TaskBankService } from './task-bank.service';
import type { TaskBankAuthContext } from './task-bank.types';

@ApiTags('assessment-task-bank')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ description: 'Malformed request, validation failure, or invalid UUID/path parameter.', type: ApiErrorDto })
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key, or no authenticated user.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'Missing role, wrong workspace, or missing required assessment scope.', type: ApiErrorDto })
@Public()
@UseGuards(TaskBankGuard)
@Controller('v1/assessment')
export class TaskBankController {
  constructor(private readonly taskBank: TaskBankService) {}

  @Get('tasks')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'List published task versions',
    description: 'Auth: workspace API key (Authorization: Bearer) with scope assessment:read, or an authenticated user session. Returns only published versions of the resolved workspace, newest first.',
  })
  @ApiOkResponse({ description: 'Published task versions with answer keys removed.', type: TaskVersionResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Requested workspace does not exist.', type: ApiErrorDto })
  async list(@OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined, @Query() query: TaskBankListQueryDto) {
    return this.taskBank.listPublished(this.auth(tenant, principal), query.workspaceId, query.limit);
  }

  @Get('tasks/:taskVersionId')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'Get one published task version',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session.',
  })
  @ApiParam({ name: 'taskVersionId', format: 'uuid', description: 'Published task version id.' })
  @ApiOkResponse({ description: 'Published task version with answer keys removed.', type: TaskVersionResponseDto })
  @ApiNotFoundResponse({ description: 'No published task version with this id.', type: ApiErrorDto })
  async get(@Param('taskVersionId', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.getPublished(this.auth(tenant, principal), id);
  }

  @Get('tasks/:taskVersionId/answer')
  @RequireTaskBankScopes('assessment:answer:read')
  @ApiOperation({
    summary: 'Reveal the answer key of a published task version',
    description: 'Auth: workspace API key with scope assessment:answer:read, or a user session with answer access. Every read is audited as task_answer_revealed.',
  })
  @ApiParam({ name: 'taskVersionId', format: 'uuid', description: 'Published task version id.' })
  @ApiOkResponse({ description: 'Answer key and public answer schema.', type: TaskAnswerResponseDto })
  @ApiNotFoundResponse({ description: 'No published task version with this id.', type: ApiErrorDto })
  async answer(@Param('taskVersionId', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.getAnswer(this.auth(tenant, principal), id);
  }

  @Post('task-sources')
  @RequireTaskBankScopes('assessment:manage')
  @ApiOperation({
    summary: 'Create a task source',
    description: 'Auth: workspace API key with scope assessment:manage, or a user session with organization_admin, workspace_admin, or content_editor role.',
  })
  @ApiCreatedResponse({ description: 'Created task source.', type: TaskSourceResponseDto })
  async createSource(@Body() body: CreateTaskSourceDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.createSource(this.auth(tenant, principal), body);
  }

  @Get('task-sources')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'List task sources',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session.',
  })
  @ApiOkResponse({ description: 'Task sources of the resolved workspace.', type: TaskSourceResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Requested workspace does not exist.', type: ApiErrorDto })
  async listSources(@Query() query: TaskBankListQueryDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.listSources(this.auth(tenant, principal), query.workspaceId, query.limit);
  }

  @Get('task-sources/:id')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'Get a task source',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Task source id.' })
  @ApiOkResponse({ description: 'Task source.', type: TaskSourceResponseDto })
  @ApiNotFoundResponse({ description: 'Task source not found in this tenant.', type: ApiErrorDto })
  async getSource(@Param('id', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.getSource(this.auth(tenant, principal), id);
  }

  @Post('task-sources/:id/import')
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Import a task snapshot into a task source',
    description: 'Auth: workspace API key with scope assessment:write, or a user session with a write-capable role. Replaying the same idempotencyKey returns the previously imported version with idempotentReplay=true.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Task source id, must be active.' })
  @ApiCreatedResponse({ description: 'Imported (or replayed) task version.', type: ImportedTaskVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Task source not found in this tenant.', type: ApiErrorDto })
  async import(@Param('id', ParseUUIDPipe) id: string, @Body() body: ImportTaskDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.importTask(this.auth(tenant, principal), id, body);
  }

  @Post('curriculum-mappings')
  @RequireTaskBankScopes('assessment:manage')
  @ApiOperation({
    summary: 'Create or update a curriculum mapping',
    description: 'Auth: workspace API key with scope assessment:manage, or a user session with a manage-capable role. Upserted per (workspace, taskSource, mappingType, externalValue) and applied to already imported tasks.',
  })
  @ApiCreatedResponse({ description: 'Upserted curriculum mapping.', type: CurriculumMappingResponseDto })
  @ApiNotFoundResponse({ description: 'Task source or referenced curriculum target not found.', type: ApiErrorDto })
  async upsertCurriculumMapping(@Body() body: CreateCurriculumMappingDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.upsertCurriculumMapping(this.auth(tenant, principal), body);
  }

  @Get('curriculum-mappings')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'List curriculum mappings',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session. Optionally filtered by taskSourceId.',
  })
  @ApiOkResponse({ description: 'Curriculum mappings of the resolved workspace.', type: CurriculumMappingResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Requested workspace or task source does not exist.', type: ApiErrorDto })
  async listCurriculumMappings(@Query() query: CurriculumMappingQueryDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.listCurriculumMappings(this.auth(tenant, principal), query.workspaceId, query.taskSourceId, query.limit);
  }

  @Post('results/external')
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Record an external assessment result',
    description: 'Auth: workspace API key with scope assessment:write (integration authentication is required). Records an immutable observation and hands off to Learning; replaying the same idempotencyKey returns idempotentReplay=true.',
  })
  @ApiCreatedResponse({ description: 'Recorded external result observation.', type: ExternalResultObservationResponseDto })
  @ApiNotFoundResponse({ description: 'External learner, imported task, or published task version not found.', type: ApiErrorDto })
  async observeExternalResult(@Body() body: ExternalResultObservationDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.observeExternalResult(this.auth(tenant, principal), body);
  }

  @Post('tasks/:taskId/drafts')
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Create a draft version of a task',
    description: 'Auth: workspace API key with scope assessment:write, or a user session with a write-capable role. Creates a new draft version; published versions stay immutable.',
  })
  @ApiParam({ name: 'taskId', format: 'uuid', description: 'Task id.' })
  @ApiCreatedResponse({ description: 'Created draft task version.', type: TaskVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Task not found in this workspace.', type: ApiErrorDto })
  async createDraft(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() body: CreateDraftDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.createDraft(this.auth(tenant, principal), taskId, body);
  }

  @Patch('task-drafts/:draftId')
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Update a draft task version',
    description: 'Auth: workspace API key with scope assessment:write, or a user session with a write-capable role. Patching a published version creates a new draft version instead of modifying it.',
  })
  @ApiParam({ name: 'draftId', format: 'uuid', description: 'Task version id (draft or published).' })
  @ApiOkResponse({ description: 'Updated or newly created draft task version.', type: TaskVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Task draft not found.', type: ApiErrorDto })
  async updateDraft(@Param('draftId', ParseUUIDPipe) id: string, @Body() body: UpdateDraftDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.updateDraft(this.auth(tenant, principal), id, body);
  }

  @Post('task-drafts/:draftId/publish')
  @RequireTaskBankScopes('assessment:manage')
  @ApiOperation({
    summary: 'Publish a draft task version',
    description: 'Auth: workspace API key with scope assessment:manage, or a user session with a manage-capable role. Only draft versions can be published; published versions become immutable.',
  })
  @ApiParam({ name: 'draftId', format: 'uuid', description: 'Draft task version id.' })
  @ApiCreatedResponse({ description: 'Published task version.', type: TaskVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Task draft not found.', type: ApiErrorDto })
  async publish(@Param('draftId', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.taskBank.publishDraft(this.auth(tenant, principal), id);
  }

  private auth(tenant?: TenantContext, principal?: AuthenticatedPrincipal): TaskBankAuthContext {
    return { tenant, principal };
  }
}
