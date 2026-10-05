import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { OptionalTenantContext } from '../../common/request-context';
import type { TenantContext } from '../core/core.types';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import {
  AttachWhiteboardResourceDto,
  CreateWhiteboardDto,
  SaveWhiteboardStateDto,
  UpdateWhiteboardDto,
  WhiteboardListQueryDto,
  WhiteboardResourceListQueryDto,
  WhiteboardResponseDto,
  WhiteboardResourceResponseDto,
  WhiteboardSaveStateResponseDto,
  WhiteboardStateResponseDto,
} from './whiteboard.dto';
import { WhiteboardService } from './whiteboard.service';

@ApiTags('whiteboard')
@ApiSecurity('workspace-api-key')
@ApiUnauthorizedResponse({ description: 'Workspace API key required.', type: ApiErrorDto })
@ApiForbiddenResponse({ description: 'Missing Whiteboard scope or cross-workspace access.', type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/whiteboards')
export class WhiteboardController {
  constructor(private readonly whiteboard: WhiteboardService) {}

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @RequireIntegrationScopes('whiteboard:write')
  @ApiOperation({ summary: 'Create a whiteboard at revision 0 for the integration tenant' })
  @ApiCreatedResponse({ type: WhiteboardResponseDto })
  create(@Body() body: CreateWhiteboardDto, @OptionalTenantContext() tenant: TenantContext) {
    return this.whiteboard.create(tenant, body);
  }

  @Get()
  @RequireIntegrationScopes('whiteboard:read')
  @ApiOperation({ summary: 'List whiteboards scoped to the integration tenant' })
  @ApiOkResponse({ type: [WhiteboardResponseDto] })
  list(@Query() query: WhiteboardListQueryDto, @OptionalTenantContext() tenant: TenantContext) {
    return this.whiteboard.list(tenant, query);
  }

  @Get(':boardId')
  @RequireIntegrationScopes('whiteboard:read')
  @ApiOperation({ summary: 'Read whiteboard metadata' })
  @ApiOkResponse({ type: WhiteboardResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  get(@Param('boardId', ParseUUIDPipe) boardId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.whiteboard.get(tenant, boardId);
  }

  @Patch(':boardId')
  @RequireIntegrationScopes('whiteboard:write')
  @ApiOperation({ summary: 'Update whiteboard title, external reference, or archive status' })
  @ApiOkResponse({ type: WhiteboardResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  update(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() body: UpdateWhiteboardDto,
    @OptionalTenantContext() tenant: TenantContext,
  ) {
    return this.whiteboard.update(tenant, boardId, body);
  }

  @Get(':boardId/state')
  @RequireIntegrationScopes('whiteboard:read')
  @ApiOperation({ summary: 'Load the latest whiteboard state snapshot' })
  @ApiOkResponse({ type: WhiteboardStateResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  getState(@Param('boardId', ParseUUIDPipe) boardId: string, @OptionalTenantContext() tenant: TenantContext) {
    return this.whiteboard.getState(tenant, boardId);
  }

  @Put(':boardId/state')
  @RequireIntegrationScopes('whiteboard:write')
  @ApiOperation({ summary: 'Persist whiteboard state at the next revision after optimistic revision check' })
  @ApiOkResponse({ type: WhiteboardSaveStateResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  saveState(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() body: SaveWhiteboardStateDto,
    @OptionalTenantContext() tenant: TenantContext,
  ) {
    return this.whiteboard.saveState(tenant, boardId, body);
  }

  @Get(':boardId/resources')
  @RequireIntegrationScopes('whiteboard:read')
  @ApiOperation({ summary: 'List optional published resource links attached to a whiteboard' })
  @ApiOkResponse({ type: [WhiteboardResourceResponseDto] })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  listResources(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query() query: WhiteboardResourceListQueryDto,
    @OptionalTenantContext() tenant: TenantContext,
  ) {
    return this.whiteboard.listResources(tenant, boardId, query.limit);
  }

  @Post(':boardId/resources')
  @RequireIntegrationScopes('whiteboard:write')
  @ApiOperation({ summary: 'Attach a published task or theory version to a whiteboard (idempotent per board and resource)' })
  @ApiCreatedResponse({ type: WhiteboardResourceResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  attachResource(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() body: AttachWhiteboardResourceDto,
    @OptionalTenantContext() tenant: TenantContext,
  ) {
    return this.whiteboard.attachResource(tenant, boardId, body);
  }

  @Delete(':boardId/resources/:resourceLinkId')
  @RequireIntegrationScopes('whiteboard:write')
  @ApiOperation({ summary: 'Detach a resource link from a whiteboard' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNotFoundResponse({ type: ApiErrorDto })
  detachResource(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('resourceLinkId', ParseUUIDPipe) resourceLinkId: string,
    @OptionalTenantContext() tenant: TenantContext,
  ) {
    return this.whiteboard.detachResource(tenant, boardId, resourceLinkId);
  }
}
