import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ApiKeyGuard } from './api-key.guard';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [AuditModule, TenancyModule],
  providers: [IntegrationsService, ApiKeyGuard],
  exports: [IntegrationsService, ApiKeyGuard],
})
export class IntegrationsModule {}
