import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { Public } from '../../common/public.decorator';
import { OptionalPrincipal, OptionalTenantContext } from '../../common/request-context';
import type { TenantContext } from '../core/core.types';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { CreateTheoryMaterialDto, TheoryListQueryDto, TheoryMaterialResponseDto, UpdateTheoryDraftDto } from './theory.dto';
import { TheoryGuard } from './theory.guard';
import { RequireTheoryScopes } from './theory.scope';
import { TheoryService } from './theory.service';
import type { TheoryAuthContext } from './theory.types';

@ApiTags('theory')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ description: 'Malformed content or invalid curriculum/task linkage.', type: ApiErrorDto })
@ApiUnauthorizedResponse({ description: 'Authentication required.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'Missing role or required Theory scope.', type: ApiErrorDto })
@Public()
@UseGuards(TheoryGuard)
@Controller('v1/theory')
export class TheoryController {
  constructor(private readonly theory: TheoryService) {}

  @Get('editor/materials')
  @RequireTheoryScopes('theory:write')
  @ApiOperation({ summary: 'List workspace Theory materials, including drafts' })
  @ApiOkResponse({ type: TheoryMaterialResponseDto, isArray: true })
  listEditor(@OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined, @Query() query: TheoryListQueryDto) {
    return this.theory.listEditor(this.auth(tenant, principal), query);
  }

  @Get('editor/materials/:materialId')
  @RequireTheoryScopes('theory:write')
  @ApiOperation({ summary: 'Read a Theory material and its version history' })
  @ApiOkResponse({ type: TheoryMaterialResponseDto })
  @ApiNotFoundResponse({ description: 'Theory material not found in this workspace.', type: ApiErrorDto })
  getEditor(@Param('materialId', ParseUUIDPipe) materialId: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.theory.getEditor(this.auth(tenant, principal), materialId);
  }

  @Post('editor/materials')
  @RequireTheoryScopes('theory:write')
  @ApiOperation({ summary: 'Create a Theory material with its first draft version' })
  @ApiCreatedResponse({ type: TheoryMaterialResponseDto })
  create(@Body() body: CreateTheoryMaterialDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.theory.create(this.auth(tenant, principal), body);
  }

  @Patch('editor/materials/:materialId/draft')
  @RequireTheoryScopes('theory:write')
  @ApiOperation({ summary: 'Update the active draft, or create the next draft after publication' })
  @ApiOkResponse({ type: TheoryMaterialResponseDto })
  updateDraft(@Param('materialId', ParseUUIDPipe) materialId: string, @Body() body: UpdateTheoryDraftDto, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.theory.updateDraft(this.auth(tenant, principal), materialId, body);
  }

  @Post('editor/materials/:materialId/publish')
  @RequireTheoryScopes('theory:manage')
  @ApiOperation({ summary: 'Publish the active Theory draft' })
  @ApiCreatedResponse({ type: TheoryMaterialResponseDto })
  publish(@Param('materialId', ParseUUIDPipe) materialId: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.theory.publish(this.auth(tenant, principal), materialId);
  }

  @Get('materials')
  @RequireTheoryScopes('theory:read')
  @ApiOperation({ summary: 'List published Theory materials', description: 'Returns only published versions in the authenticated workspace.' })
  @ApiOkResponse({ type: TheoryMaterialResponseDto, isArray: true })
  listPublished(@OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined, @Query() query: TheoryListQueryDto) {
    return this.theory.listPublished(this.auth(tenant, principal), query);
  }

  @Get('materials/:materialId')
  @RequireTheoryScopes('theory:read')
  @ApiOperation({ summary: 'Read one published Theory material' })
  @ApiOkResponse({ type: TheoryMaterialResponseDto })
  @ApiNotFoundResponse({ description: 'Published Theory material not found in this workspace.', type: ApiErrorDto })
  getPublished(@Param('materialId', ParseUUIDPipe) materialId: string, @OptionalTenantContext() tenant: TenantContext | undefined, @OptionalPrincipal() principal: AuthenticatedPrincipal | undefined) {
    return this.theory.getPublished(this.auth(tenant, principal), materialId);
  }

  private auth(tenant?: TenantContext, principal?: AuthenticatedPrincipal): TheoryAuthContext {
    return { tenant, principal };
  }
}
