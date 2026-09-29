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
import { RequireTaskBankScopes } from './task-bank.scope';
import { TaskBankGuard } from './task-bank.guard';
import type { TaskBankAuthContext } from './task-bank.types';
import {
  CreateVariantDraftDto,
  CreatedVariantVersionResponseDto,
  UpdateVariantDraftDto,
  VariantListQueryDto,
  VariantVersionResponseDto,
} from './variant.dto';
import { VariantService } from './variant.service';

@ApiTags('assessment-variants')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ description: 'Malformed request, validation failure, invalid UUID, or unresolved/invalid variant items.', type: ApiErrorDto })
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or revoked workspace API key, or no authenticated user.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'Missing role, wrong workspace, or missing required assessment scope.', type: ApiErrorDto })
@Public()
@UseGuards(TaskBankGuard)
@Controller('v1/assessment/variants')
export class VariantController {
  constructor(private readonly variants: VariantService) {}

  @Get()
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'List published variant versions',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session. Returns at most one (the latest) published version per variant.',
  })
  @ApiOkResponse({ description: 'Published variant versions with their ordered items.', type: VariantVersionResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Requested workspace does not exist.', type: ApiErrorDto })
  async list(@Query() query: VariantListQueryDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.variants.listPublished(this.auth(tenant, principal), query.workspaceId, query.limit);
  }

  @Get(':variantVersionId')
  @RequireTaskBankScopes('assessment:read')
  @ApiOperation({
    summary: 'Get one published variant version',
    description: 'Auth: workspace API key with scope assessment:read, or an authenticated user session.',
  })
  @ApiParam({ name: 'variantVersionId', format: 'uuid', description: 'Published variant version id.' })
  @ApiOkResponse({ description: 'Published variant version with its ordered items.', type: VariantVersionResponseDto })
  @ApiNotFoundResponse({ description: 'No published variant version with this id.', type: ApiErrorDto })
  async get(@Param('variantVersionId', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.variants.getPublished(this.auth(tenant, principal), id);
  }

  @Post()
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Create a draft variant',
    description: 'Auth: workspace API key with scope assessment:write, or a user session with a write-capable role. Items reference tasks by taskVersionId or externalTaskId; duplicates of idempotencyKey are replayed.',
  })
  @ApiCreatedResponse({ description: 'Created draft variant version.', type: CreatedVariantVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Workspace or referenced task source not found.', type: ApiErrorDto })
  async create(@Body() body: CreateVariantDraftDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.variants.createDraft(this.auth(tenant, principal), body);
  }

  @Patch(':variantVersionId')
  @RequireTaskBankScopes('assessment:write')
  @ApiOperation({
    summary: 'Update a draft variant version',
    description: 'Auth: workspace API key with scope assessment:write, or a user session with a write-capable role. Patching a published version creates a new draft version instead of modifying it.',
  })
  @ApiParam({ name: 'variantVersionId', format: 'uuid', description: 'Variant version id (draft or published).' })
  @ApiOkResponse({ description: 'Updated or newly created draft variant version.', type: VariantVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Variant version not found.', type: ApiErrorDto })
  async update(@Param('variantVersionId', ParseUUIDPipe) id: string, @Body() body: UpdateVariantDraftDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.variants.updateDraft(this.auth(tenant, principal), id, body);
  }

  @Post(':variantVersionId/publish')
  @RequireTaskBankScopes('assessment:manage')
  @ApiOperation({
    summary: 'Publish a draft variant version',
    description: 'Auth: workspace API key with scope assessment:manage, or a user session with a manage-capable role. All items must resolve to published task versions, otherwise 400 VARIANT_UNRESOLVED with per-item details is returned.',
  })
  @ApiParam({ name: 'variantVersionId', format: 'uuid', description: 'Draft variant version id.' })
  @ApiCreatedResponse({ description: 'Published variant version with resolved items.', type: VariantVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Variant version not found.', type: ApiErrorDto })
  async publish(@Param('variantVersionId', ParseUUIDPipe) id: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.variants.publishDraft(this.auth(tenant, principal), id);
  }

  private auth(tenant?: TenantContext, principal?: AuthenticatedPrincipal): TaskBankAuthContext {
    return { tenant, principal };
  }
}
