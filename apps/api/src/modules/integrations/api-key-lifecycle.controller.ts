import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
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
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import type { TenantContext } from '../core/core.types';
import { ApiKeyGuard } from './api-key.guard';
import { RequireIntegrationScopes } from './scope.decorator';
import type { ApiKeyMetadata, IntegrationScope } from './integrations.types';
import { IntegrationsService } from './integrations.service';
import {
  ApiKeyMetadataDto,
  ApiKeySecretResponseDto,
  CreateApiKeyDto,
  ListApiKeysDto,
} from './api-key.dto';

@ApiTags('integrations')
@ApiSecurity('workspace-api-key')
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/integrations/api-keys')
export class ApiKeyLifecycleController {
  constructor(private readonly integrations: IntegrationsService) {}

  private toResponse(key: ApiKeyMetadata): ApiKeyMetadataDto {
    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes as IntegrationScope[],
      status: key.status,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
    };
  }

  @Get()
  @RequireIntegrationScopes('integrations:read')
  @ApiOperation({ summary: 'List API keys for the current integration', description: 'Requires the integrations:read scope. Only safe key metadata is returned.' })
  @ApiOkResponse({ type: ApiKeyMetadataDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  async list(
    @CurrentTenantContext() context: TenantContext,
    @Query() query: ListApiKeysDto,
  ): Promise<ApiKeyMetadataDto[]> {
    const keys = await this.integrations.listApiKeys(context, query.limit);
    return keys.map((key) => this.toResponse(key));
  }

  @Post()
  @RequireIntegrationScopes('integrations:write')
  @ApiOperation({ summary: 'Create an API key', description: 'Requires the integrations:write scope. The raw secret is returned exactly once.' })
  @ApiCreatedResponse({ type: ApiKeySecretResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  async create(
    @CurrentTenantContext() context: TenantContext,
    @Body() body: CreateApiKeyDto,
  ): Promise<ApiKeySecretResponseDto> {
    const created = await this.integrations.createApiKey({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      integrationId: context.integrationId,
      name: body.name,
      scopes: body.scopes,
    });
    const { secret } = created;
    return {
      key: this.toResponse({ ...created, lastUsedAt: null, revokedAt: null }),
      secret,
    };
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequireIntegrationScopes('integrations:write')
  @ApiOperation({ summary: 'Revoke an API key', description: 'Requires the integrations:write scope. The key stops authenticating immediately.' })
  @ApiOkResponse({ type: ApiKeyMetadataDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse({ description: 'Active API key not found' })
  async revoke(
    @CurrentTenantContext() context: TenantContext,
    @Param('id', new ParseUUIDPipe()) apiKeyId: string,
  ): Promise<ApiKeyMetadataDto> {
    return this.toResponse(await this.integrations.revokeApiKey(context, apiKeyId));
  }

  @Post(':id/rotate')
  @RequireIntegrationScopes('integrations:write')
  @ApiOperation({ summary: 'Rotate an API key', description: 'Requires the integrations:write scope. The old key is revoked atomically and the new raw secret is returned exactly once.' })
  @ApiCreatedResponse({ type: ApiKeySecretResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse({ description: 'Active API key not found' })
  async rotate(
    @CurrentTenantContext() context: TenantContext,
    @Param('id', new ParseUUIDPipe()) apiKeyId: string,
  ): Promise<ApiKeySecretResponseDto> {
    const rotated = await this.integrations.rotateApiKey(context, apiKeyId);
    const { secret } = rotated;
    return {
      key: this.toResponse({ ...rotated, lastUsedAt: null, revokedAt: null }),
      secret,
    };
  }
}
