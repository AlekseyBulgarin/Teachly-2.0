import { SetMetadata } from '@nestjs/common';
import type { IntegrationScope } from './integrations.types';

export const REQUIRED_SCOPES_KEY = 'required_integration_scopes';
export const RequireIntegrationScopes = (...scopes: IntegrationScope[]) => SetMetadata(REQUIRED_SCOPES_KEY, scopes);
