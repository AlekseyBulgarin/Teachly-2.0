import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CoreModule } from '../core/core.module';
import { ApiKeyGuard } from './api-key.guard';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyLifecycleController } from './api-key-lifecycle.controller';

@Module({
  imports: [AuditModule, TenancyModule, CoreModule],
  controllers: [IntegrationsController, ApiKeyLifecycleController],
  providers: [IntegrationsService, ApiKeyGuard],
  exports: [IntegrationsService, ApiKeyGuard],
})
export class IntegrationsModule {}
