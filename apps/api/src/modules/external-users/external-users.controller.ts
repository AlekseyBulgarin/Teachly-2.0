import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { MachineAuthenticated } from '../../common/machine-auth.decorator';
import { CurrentTenantContext } from '../../common/request-context';
import { ApiKeyGuard } from '../integrations/api-key.guard';
import type { TenantContext } from '../integrations/integrations.types';
import { RequireIntegrationScopes } from '../integrations/scope.decorator';
import { ExternalUserResponseDto, UpsertExternalUserDto } from './external-users.dto';
import { ExternalUsersService } from './external-users.service';

@ApiTags('external-users')
@ApiSecurity('workspace-api-key')
@ApiBadRequestResponse({ type: ApiErrorDto })
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@ApiForbiddenResponse({ type: ApiErrorDto })
@MachineAuthenticated()
@UseGuards(ApiKeyGuard)
@Controller('v1/external-users')
export class ExternalUsersController {
  constructor(private readonly externalUsers: ExternalUsersService) {}

  @Post()
  @RequireIntegrationScopes('external_users:write')
  @ApiCreatedResponse({ type: ExternalUserResponseDto })
  async upsert(
    @CurrentTenantContext() context: TenantContext,
    @Body() body: UpsertExternalUserDto,
  ): Promise<ExternalUserResponseDto> {
    return ExternalUserResponseDto.from(await this.externalUsers.upsert(context, body.externalUserId));
  }

  @Get(':id')
  @RequireIntegrationScopes('external_users:read')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ExternalUserResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async get(
    @CurrentTenantContext() context: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExternalUserResponseDto> {
    return ExternalUserResponseDto.from(await this.externalUsers.get(context, id));
  }

  @Get()
  @RequireIntegrationScopes('external_users:read')
  @ApiOkResponse({ type: [ExternalUserResponseDto] })
  async list(@CurrentTenantContext() context: TenantContext): Promise<ExternalUserResponseDto[]> {
    return (await this.externalUsers.list(context)).map(ExternalUserResponseDto.from);
  }
}
